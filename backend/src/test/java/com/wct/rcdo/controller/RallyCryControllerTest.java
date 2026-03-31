package com.wct.rcdo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wct.rcdo.dto.CreateRallyCryRequest;
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
class RallyCryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String BASE_URL = "/api/rcdo/rally-cries";

    @Test
    void createRallyCry_asManager_returns201() throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest("Q1 Rally", "First quarter rally cry");

        mockMvc.perform(post(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Q1 Rally"))
                .andExpect(jsonPath("$.description").value("First quarter rally cry"))
                .andExpect(jsonPath("$.sortOrder").value(0))
                .andExpect(jsonPath("$.archivedAt").isEmpty())
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void createRallyCry_asIC_returns403() throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest("Q1 Rally", "desc");

        mockMvc.perform(post(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createRallyCry_noAuth_returns401() throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest("Q1 Rally", "desc");

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createRallyCry_blankName_returns400() throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest("", "desc");

        mockMvc.perform(post(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAll_asIC_returns200() throws Exception {
        // Create a rally cry first
        createRallyCry("Rally 1", "desc1");

        mockMvc.perform(get(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Rally 1"));
    }

    @Test
    void findAll_excludesArchivedByDefault() throws Exception {
        String id = createRallyCry("Rally 1", "desc1");

        // Archive it
        mockMvc.perform(patch(BASE_URL + "/" + id + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk());

        // List without includeArchived should return empty
        mockMvc.perform(get(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // List with includeArchived=true should return the item
        mockMvc.perform(get(BASE_URL)
                        .param("includeArchived", "true")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void findById_returns200() throws Exception {
        String id = createRallyCry("Rally 1", "desc1");

        mockMvc.perform(get(BASE_URL + "/" + id)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rally 1"));
    }

    @Test
    void findById_notFound_returns404() throws Exception {
        mockMvc.perform(get(BASE_URL + "/" + UUID.randomUUID())
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC"))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_asManager_returns200() throws Exception {
        String id = createRallyCry("Rally 1", "desc1");
        UpdateRallyCryRequest updateReq = new UpdateRallyCryRequest("Updated Rally", "new desc", 5);

        mockMvc.perform(put(BASE_URL + "/" + id)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Rally"))
                .andExpect(jsonPath("$.description").value("new desc"))
                .andExpect(jsonPath("$.sortOrder").value(5));
    }

    @Test
    void update_asIC_returns403() throws Exception {
        String id = createRallyCry("Rally 1", "desc1");
        UpdateRallyCryRequest updateReq = new UpdateRallyCryRequest("Updated", "desc", 1);

        mockMvc.perform(put(BASE_URL + "/" + id)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "IC")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void archiveAndUnarchive() throws Exception {
        String id = createRallyCry("Rally 1", "desc1");

        // Archive
        mockMvc.perform(patch(BASE_URL + "/" + id + "/archive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isNotEmpty());

        // Unarchive
        mockMvc.perform(patch(BASE_URL + "/" + id + "/unarchive")
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").isEmpty());
    }

    @Test
    void createRallyCry_asLeadership_returns201() throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest("Leadership Rally", "desc");

        mockMvc.perform(post(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "LEADERSHIP")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private String createRallyCry(String name, String description) throws Exception {
        CreateRallyCryRequest request = new CreateRallyCryRequest(name, description);
        MvcResult result = mockMvc.perform(post(BASE_URL)
                        .header("X-User-Id", "user-1")
                        .header("X-User-Role", "MANAGER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }
}
