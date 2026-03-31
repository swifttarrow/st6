package com.wct.rcdo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.rcdo.dto.CreateDefiningObjectiveRequest;
import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.dto.UpdateDefiningObjectiveRequest;
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
class DefiningObjectiveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String RC_URL = "/api/rcdo/rally-cries";
    private static final String DO_URL = "/api/rcdo/defining-objectives";

    @Test
    void createDefiningObjective_asManager_returns201() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        CreateDefiningObjectiveRequest request = new CreateDefiningObjectiveRequest(
                UUID.fromString(rcId), "DO1", "objective desc");

        mockMvc.perform(post(DO_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.rallyCryId").value(rcId))
                .andExpect(jsonPath("$.name").value("DO1"));
    }

    @Test
    void createDefiningObjective_asIC_returns403() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        CreateDefiningObjectiveRequest request = new CreateDefiningObjectiveRequest(
                UUID.fromString(rcId), "DO1", "desc");

        mockMvc.perform(post(DO_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createDefiningObjective_invalidRallyCryId_returns404() throws Exception {
        CreateDefiningObjectiveRequest request = new CreateDefiningObjectiveRequest(
                UUID.randomUUID(), "DO1", "desc");

        mockMvc.perform(post(DO_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createDefiningObjective_blankName_returns400() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        CreateDefiningObjectiveRequest request = new CreateDefiningObjectiveRequest(
                UUID.fromString(rcId), "", "desc");

        mockMvc.perform(post(DO_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAll_filtersByRallyCryId() throws Exception {
        String rcId1 = createRallyCry("RC1", "desc");
        String rcId2 = createRallyCry("RC2", "desc");
        createDefiningObjective(rcId1, "DO1", "desc");
        createDefiningObjective(rcId2, "DO2", "desc");

        mockMvc.perform(get(DO_URL)
                        .param("rallyCryId", rcId1)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("DO1"));
    }

    @Test
    void findAll_excludesArchivedByDefault() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        String doId = createDefiningObjective(rcId, "DO1", "desc");

        mockMvc.perform(patch(DO_URL + "/" + doId + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());

        mockMvc.perform(get(DO_URL)
                        .param("rallyCryId", rcId)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get(DO_URL)
                        .param("rallyCryId", rcId)
                        .param("includeArchived", "true")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void findById_returns200() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        String doId = createDefiningObjective(rcId, "DO1", "desc");

        mockMvc.perform(get(DO_URL + "/" + doId)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("DO1"));
    }

    @Test
    void findById_notFound_returns404() throws Exception {
        mockMvc.perform(get(DO_URL + "/" + UUID.randomUUID())
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_asManager_returns200() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        String doId = createDefiningObjective(rcId, "DO1", "desc");
        UpdateDefiningObjectiveRequest updateReq = new UpdateDefiningObjectiveRequest("Updated DO", "new desc", 3);

        mockMvc.perform(put(DO_URL + "/" + doId)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated DO"))
                .andExpect(jsonPath("$.sortOrder").value(3));
    }

    @Test
    void archiveAndUnarchive() throws Exception {
        String rcId = createRallyCry("RC1", "desc");
        String doId = createDefiningObjective(rcId, "DO1", "desc");

        mockMvc.perform(patch(DO_URL + "/" + doId + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());

        mockMvc.perform(patch(DO_URL + "/" + doId + "/unarchive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());
    }

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
}
