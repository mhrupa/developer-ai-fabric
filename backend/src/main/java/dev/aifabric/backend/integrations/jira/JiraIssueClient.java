package dev.aifabric.backend.integrations.jira;

import java.util.Map;

public interface JiraIssueClient {
    JiraIssue fetchIssue(String issueKey, Map<String, Object> input);
}
