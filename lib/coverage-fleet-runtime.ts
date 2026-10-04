import { heartbeat, validHeartbeatUrl } from "./coverage-operations";
import { redisFleetStore, runFleet, validFleetUrl, type FleetStore } from "./coverage-fleet";

export function fleetRuntimeConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.COVERAGE_DEMAND_FLEET_REDIS_URL;
  const token = env.COVERAGE_DEMAND_FLEET_REDIS_TOKEN;
  const evaluator = env.COVERAGE_DEMAND_FLEET_EVALUATOR_HEARTBEAT_URL;
  const incident = env.COVERAGE_DEMAND_FLEET_INCIDENT_HEARTBEAT_URL;
  return {
    enabled: env.COVERAGE_DEMAND_FLEET_MONITOR_ENABLED === "true",
    configured: Boolean(validFleetUrl(url) && token && token.length <= 4096 && !/[\r\n]/.test(token)
      && validHeartbeatUrl(evaluator) && validHeartbeatUrl(incident) && evaluator !== incident),
    createStore: (): FleetStore => redisFleetStore(url!, token!),
    evaluator: (signal: "success" | "fail") => heartbeat(evaluator, signal),
    incident: (signal: "success" | "fail") => heartbeat(incident, signal),
  };
}

export function fleetRoute(request: Request, action: "evaluate" | "review" | "recover") {
  const config = fleetRuntimeConfig();
  // Lazy adapter: auth/disabled requests cannot even construct an external request.
  const store = lazyFleetStore(config);
  return runFleet(request, action, {
    enabled: config.enabled, configured: config.configured,
    secret: action === "evaluate" ? process.env.CRON_SECRET : process.env.COVERAGE_DEMAND_FLEET_RECOVERY_SECRET,
  }, store, config.evaluator, config.incident);
}

export function lazyFleetStore(config = fleetRuntimeConfig()): FleetStore {
  return {
    record: (window, delta) => config.createStore().record(window, delta),
    central: (...args) => config.createStore().central(...args),
  };
}
