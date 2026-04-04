package com.wct.rcdo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.CreateOutcomeRequest;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.dto.UpdateOutcomeRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static com.wct.support.TestJwtAuth.jwtAuth;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OutcomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String RC_URL = "/api/rcdo/rally-cries";
    private static final String DO_URL = "/api/rcdo/defining-objectives";
    private static final String OC_URL = "/api/rcdo/outcomes";

    @Test
    void createOutcome_asManager_returns201() throws Exception {
        String doId = createHierarchy();
        CreateOutcomeRequest request = new CreateOutcomeRequest(UUID.fromString(doId), "OC1", "outcome desc");

        mockMvc.perform(post(OC_URL)
                        .with(jwtAuth("user-1", "MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.definingObjectiveId").value(doId))
                .andExpect(jsonPath("$.name").value("OC1"));
    }

    @Test
    void createOutcome_asIC_returns403() throws Exception {
        String doId = createHierarchy();
        CreateOutcomeRequest request = new CreateOutcomeRequest(UUID.fromString(doId), "OC1", "desc");

        mockMvc.perform(post(OC_URL)
                        .with(jwtAuth("user-1", "IC"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createOutcome_invalidDefiningObjectiveId_returns404() throws Exception {
        CreateOutcomeRequest request = new CreateOutcomeRequest(UUID.randomUUID(), "OC1", "desc");

        mockMvc.perform(post(OC_URL)
                        .with(jwtAuth("user-1", "MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createOutcome_blankName_returns400() throws Exception {
        String doId = createHierarchy();
        CreateOutcomeRequest request = new CreateOutcomeRequest(UUID.fromString(doId), "  ", "desc");

        mockMvc.perform(post(OC_URL)
                        .with(jwtAuth("user-1", "MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAll_filtersByDefiningObjectiveId() throws Exception {
        String doId = createHierarchy();
        createOutcome(doId, "OC1", "desc");

        mockMvc.perform(get(OC_URL)
                        .param("definingObjectiveId", doId)
                        .with(jwtAuth("user-1", "IC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("OC1"));
    }

    @Test
    void findAll_excludesArchivedByDefault() throws Exception {
        String doId = createHierarchy();
        String ocId = createOutcome(doId, "OC1", "desc");

        mockMvc.perform(patch(OC_URL + "/" + ocId + "/archive")
                        .with(jwtAuth("user-1", "MANAGER")))
                .andExpect(status().isOk());

        mockMvc.perform(get(OC_URL)
                        .param("definingObjectiveId", doId)
                        .with(jwtAuth("user-1", "IC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get(OC_URL)
                        .param("definingObjectiveId", doId)
                        .param("includeArchived", "true")
                        .with(jwtAuth("user-1", "IC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void findById_returns200() throws Exception {
        String doId = createHierarchy();
        String ocId = createOutcome(doId, "OC1", "desc");

        mockMvc.perform(get(OC_URL + "/" + ocId)
                        .with(jwtAuth("user-1", "IC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("OC1"));
    }

    @Test
    void findById_notFound_returns404() throws Exception {
        mockMvc.perform(get(OC_URL + "/" + UUID.randomUUID())
                        .with(jwtAuth("user-1", "IC")))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_asManager_returns200() throws Exception {
        String doId = createHierarchy();
        String ocId = createOutcome(doId, "OC1", "desc");
        UpdateOutcomeRequest updateReq = new UpdateOutcomeRequest("Updated OC", "new desc", 7);

        mockMvc.perform(put(OC_URL + "/" + ocId)
                        .with(jwtAuth("user-1", "MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated OC"))
                .andExpect(jsonPath("$.sortOrder").value(7));
    }

    @Test
    void archiveAndUnarchive() throws Exception {
        String doId = createHierarchy();
        String ocId = createOutcome(doId, "OC1", "desc");

        mockMvc.perform(patch(OC_URL + "/" + ocId + "/archive")
                        .with(jwtAuth("user-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());

        mockMvc.perform(patch(OC_URL + "/" + ocId + "/unarchive")
                        .with(jwtAuth("user-1", "MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());
    }

    /** Creates RallyCry -> DefiningObjective hierarchy and returns the DO id */
    private String createHierarchy() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        return createDefiningObjective(rcId, "DO1", "desc");
    }

    private String createRallyCry(String name, String description) throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest(name, description);
        MvcResult result = mockMvc.perform(post(RC_URL)
                        .with(jwtAuth("user-1", "MANAGER"))
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
                        .with(jwtAuth("user-1", "MANAGER"))
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
                        .with(jwtAuth("user-1", "MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }
}
