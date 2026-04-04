package com.wct.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.demo-host.enabled=true")
@AutoConfigureMockMvc
class HostDemoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void managerPersona_returnsJwtBackedHostContext() throws Exception {
        String responseBody = mockMvc.perform(get("/demo-host/context").param("persona", "manager"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persona").value("manager"))
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andExpect(jsonPath("$.defaultRoute").value("/team"))
                .andExpect(jsonPath("$.directReportIds[0]").value("alice"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        DemoHostContextResponse response = objectMapper.readValue(responseBody, DemoHostContextResponse.class);

        mockMvc.perform(get("/api/dashboard/team")
                        .param("date", "2026-03-30")
                        .param("memberIds", "alice")
                        .header("Authorization", "Bearer " + response.accessToken()))
                .andExpect(status().isOk());
    }

    @Test
    void icPersonaToken_canCallProtectedApi() throws Exception {
        String responseBody = mockMvc.perform(get("/demo-host/context").param("persona", "ic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("alice"))
                .andExpect(jsonPath("$.role").value("IC"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        DemoHostContextResponse response = objectMapper.readValue(responseBody, DemoHostContextResponse.class);

        mockMvc.perform(get("/api/plans").param("date", "2026-03-30")
                        .header("Authorization", "Bearer " + response.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("alice"));
    }

    @Test
    void unknownPersona_returns400() throws Exception {
        mockMvc.perform(get("/demo-host/context").param("persona", "unknown"))
                .andExpect(status().isBadRequest());
    }
}
