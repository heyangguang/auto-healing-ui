declare namespace GeneratedAutoHealing {
  type WorkbenchIncidentStats = {
    pending_count?: number;
    last_7_days_total?: number;
  };

  type WorkbenchOverview = {
    system_health?: SystemHealth;
    resource_overview?: ResourceOverview;
    healing_stats?: HealingStats;
    incident_stats?: WorkbenchIncidentStats;
    host_stats?: HostStats;
  };
}
