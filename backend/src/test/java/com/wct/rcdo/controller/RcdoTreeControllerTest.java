package com.wct.rcdo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.dto.UpdateDefiningObjectiveRequest;
import com.wct.rcdo.dto.UpdateOutcomeRequest;
import com.wct.rcdo.dto.UpdateRallyCryRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RcdoTreeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String RC_URL = "/api/rcdo/rally-cries";
    private static final String DO_URL = "/api/rcdo/defining-objectives";
    private static final String OC_URL = "/api/rcdo/outcomes";
    private static final String TREE_URL = "/api/rcdo/tree";
    private static final String SEARCH_URL = "/api/rcdo/outcomes/search";

    @Test
    void tree_returnsCorrectNestedStructure() throws Exception {
        String rcId = createRallyCry("Rally 1", "rc desc");
        String doId = createDefiningObjective(rcId, "DO 1", "do desc");
        createOutcome(doId, "Outcome 1", "oc desc");

        mockMvc.perform(get(TREE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Rally 1"))
                .andExpect(jsonPath("$[0].description").value("rc desc"))
                .andExpect(jsonPath("$[0].definingObjectives", hasSize(1)))
                .andExpect(jsonPath("$[0].definingObjectives[0].name").value("DO 1"))
                .andExpect(jsonPath("$[0].definingObjectives[0].description").value("do desc"))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes", hasSize(1)))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes[0].name").value("Outcome 1"))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes[0].description").value("oc desc"));
    }

    @Test
    void tree_excludesArchivedRallyCries() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        archiveRallyCry(rcId);

        mockMvc.perform(get(TREE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void tree_excludesArchivedDefiningObjectives() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        archiveDefiningObjective(doId);

        mockMvc.perform(get(TREE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].definingObjectives", hasSize(0)));
    }

    @Test
    void tree_excludesArchivedOutcomes() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        String ocId = createOutcome(doId, "Outcome 1", "desc");
        archiveOutcome(ocId);

        mockMvc.perform(get(TREE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes", hasSize(0)));
    }

    @Test
    void tree_orderedBySortOrder() throws Exception {
        String rc2Id = createRallyCry("Rally B", "desc");
        String rc1Id = createRallyCry("Rally A", "desc");
        updateRallyCrySortOrder(rc1Id, "Rally A", 0);
        updateRallyCrySortOrder(rc2Id, "Rally B", 1);

        String do2Id = createDefiningObjective(rc1Id, "DO B", "desc");
        String do1Id = createDefiningObjective(rc1Id, "DO A", "desc");
        updateDefiningObjectiveSortOrder(do1Id, "DO A", 0);
        updateDefiningObjectiveSortOrder(do2Id, "DO B", 1);

        String oc2Id = createOutcome(do1Id, "OC B", "desc");
        String oc1Id = createOutcome(do1Id, "OC A", "desc");
        updateOutcomeSortOrder(oc1Id, "OC A", 0);
        updateOutcomeSortOrder(oc2Id, "OC B", 1);

        mockMvc.perform(get(TREE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rally A"))
                .andExpect(jsonPath("$[1].name").value("Rally B"))
                .andExpect(jsonPath("$[0].definingObjectives[0].name").value("DO A"))
                .andExpect(jsonPath("$[0].definingObjectives[1].name").value("DO B"))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes[0].name").value("OC A"))
                .andExpect(jsonPath("$[0].definingObjectives[0].outcomes[1].name").value("OC B"));
    }

    @Test
    void search_returnsMatchingOutcomesWithParentNames() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        createOutcome(doId, "Revenue Growth", "desc");
        createOutcome(doId, "Cost Reduction", "desc");

        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "Revenue")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].outcomeName").value("Revenue Growth"))
                .andExpect(jsonPath("$[0].definingObjectiveName").value("DO 1"))
                .andExpect(jsonPath("$[0].rallyCryName").value("Rally 1"));
    }

    @Test
    void search_isCaseInsensitive() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        createOutcome(doId, "Revenue Growth", "desc");

        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "revenue")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].outcomeName").value("Revenue Growth"));
    }

    @Test
    void search_excludesOutcomesUnderArchivedRallyCry() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        createOutcome(doId, "Revenue Growth", "desc");
        archiveRallyCry(rcId);

        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "Revenue")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void search_excludesOutcomesUnderArchivedDefiningObjective() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        createOutcome(doId, "Revenue Growth", "desc");
        archiveDefiningObjective(doId);

        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "Revenue")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void search_excludesArchivedOutcomes() throws Exception {
        String rcId = createRallyCry("Rally 1", "desc");
        String doId = createDefiningObjective(rcId, "DO 1", "desc");
        String ocId = createOutcome(doId, "Revenue Growth", "desc");
        archiveOutcome(ocId);

        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "Revenue")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void search_withEmptyQuery_returns400() throws Exception {
        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void search_withMissingQuery_returns400() throws Exception {
        mockMvc.perform(get(SEARCH_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void search_withWhitespaceQuery_returns400() throws Exception {
        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "   ")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void search_orderedBySortOrder() throws Exception {
        String rc2Id = createRallyCry("Rally B", "desc");
        String rc1Id = createRallyCry("Rally A", "desc");
        updateRallyCrySortOrder(rc1Id, "Rally A", 0);
        updateRallyCrySortOrder(rc2Id, "Rally B", 1);

        String do1Id = createDefiningObjective(rc1Id, "DO A", "desc");
        String do2Id = createDefiningObjective(rc2Id, "DO B", "desc");

        String oc2Id = createOutcome(do2Id, "Target Beta", "desc");
        String oc1Id = createOutcome(do1Id, "Target Alpha", "desc");

        mockMvc.perform(get(SEARCH_URL)
                        .param("q", "Target")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].outcomeName").value("Target Alpha"))
                .andExpect(jsonPath("$[1].outcomeName").value("Target Beta"));
    }

    // --- Helper methods ---

    private String createRallyCry(String name, String description) throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest(name, description);
        MvcResult result = mockMvc.perform(post(RC_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createDefiningObjective(String rallyCryId, String name, String description) throws Exception {
        CreateDefiningObjectiveRequest request = new CreateDefiningObjectiveRequest(
                UUID.fromString(rallyCryId), name, description);
        MvcResult result = mockMvc.perform(post(DO_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createOutcome(String definingObjectiveId, String name, String description) throws Exception {
        CreateOutcomeRequest request = new CreateOutcomeRequest(
                UUID.fromString(definingObjectiveId), name, description);
        MvcResult result = mockMvc.perform(post(OC_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private void archiveRallyCry(String id) throws Exception {
        mockMvc.perform(patch(RC_URL + "/" + id + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());
    }

    private void archiveDefiningObjective(String id) throws Exception {
        mockMvc.perform(patch(DO_URL + "/" + id + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());
    }

    private void archiveOutcome(String id) throws Exception {
        mockMvc.perform(patch(OC_URL + "/" + id + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());
    }

    private void updateRallyCrySortOrder(String id, String name, int sortOrder) throws Exception {
        UpdateRallyCryRequest request = new UpdateRallyCryRequest(name, "desc", sortOrder);
        mockMvc.perform(put(RC_URL + "/" + id)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private void updateDefiningObjectiveSortOrder(String id, String name, int sortOrder) throws Exception {
        UpdateDefiningObjectiveRequest request = new UpdateDefiningObjectiveRequest(name, "desc", sortOrder);
        mockMvc.perform(put(DO_URL + "/" + id)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private void updateOutcomeSortOrder(String id, String name, int sortOrder) throws Exception {
        UpdateOutcomeRequest request = new UpdateOutcomeRequest(name, "desc", sortOrder);
        mockMvc.perform(put(OC_URL + "/" + id)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
