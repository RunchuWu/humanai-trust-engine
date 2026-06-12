export type TrialLabel = "proceed" | "reject";

export type TrialType =
  | "routing_dispatch"
  | "self_driving_maneuver"
  | "target_identification"
  | "hazard_evasion";

export interface Trial {
  trial_id: string;
  trial_type: TrialType;
  scenario_title: string;
  situation: string;
  evidence: string[];
  action_label: string;
  opposite_action_label: string;
  ground_truth: TrialLabel;
  ai_reco: TrialLabel;
  confidence: number;
  rationale_control: string;
  rationale_warm: string;
}

export function getOutcomeLabel(trial: Trial, outcome: TrialLabel): string {
  return outcome === "proceed"
    ? trial.action_label
    : trial.opposite_action_label;
}

export function getAiRecommendationLabel(trial: Trial): string {
  return getOutcomeLabel(trial, trial.ai_reco);
}

export function getOppositeRecommendationLabel(trial: Trial): string {
  return trial.ai_reco === "proceed"
    ? trial.opposite_action_label
    : trial.action_label;
}

export const TRIALS: Trial[] = [
  {
    trial_id: "ops_01",
    trial_type: "hazard_evasion",
    scenario_title: "Delivery Drone Bird Hazard",
    situation:
      "You are monitoring an autonomous delivery drone on an active route. Wind has picked up and birds are detected 40m ahead at the drone's altitude.",
    evidence: [
      "Drone altitude: 30m",
      "Detected birds: 40m ahead, same altitude band",
      "Crosswind: moderate and increasing",
    ],
    action_label: "Descend to 15m",
    opposite_action_label: "Hold current altitude",
    ground_truth: "proceed",
    ai_reco: "proceed",
    confidence: 88,
    rationale_control:
      "Immediate descent lowers collision risk while keeping the drone above mapped ground obstacles.",
    rationale_warm:
      "I recommend descending to 15m because it moves the drone out of the bird path while staying safely above mapped obstacles.",
  },
  {
    trial_id: "ops_02",
    trial_type: "routing_dispatch",
    scenario_title: "Warehouse Drone Dispatch",
    situation:
      "A medical package needs to leave a warehouse during light rain. One drone is available for a west corridor route near temporary airspace restrictions.",
    evidence: [
      "Battery estimate on arrival: 18%",
      "West corridor has a temporary 10-minute restriction window",
      "Rain intensity is below the normal no-fly threshold",
    ],
    action_label: "Dispatch via west corridor",
    opposite_action_label: "Hold dispatch for route clearance",
    ground_truth: "reject",
    ai_reco: "proceed",
    confidence: 73,
    rationale_control:
      "Rain remains below the no-fly threshold, and the corridor should clear before the drone reaches the restricted segment.",
    rationale_warm:
      "I would dispatch via the west corridor. The rain is still within limits, and the restriction window should clear in time.",
  },
  {
    trial_id: "ops_03",
    trial_type: "target_identification",
    scenario_title: "Roadside Sensor Classification",
    situation:
      "A roadside autonomy sensor flags an unclear shape near a crosswalk during dusk operations.",
    evidence: [
      "Thermal signature is consistent with a person",
      "Camera image is partially blocked by glare",
      "Object location is 1.5m from the curb line",
    ],
    action_label: "Treat as pedestrian hazard",
    opposite_action_label: "Treat as static object",
    ground_truth: "proceed",
    ai_reco: "reject",
    confidence: 69,
    rationale_control:
      "The camera view is partially blocked, and the object is near the curb line rather than clearly inside the crosswalk path.",
    rationale_warm:
      "I would treat this as a static object. The image is unclear, and the object position does not clearly confirm a pedestrian hazard.",
  },
  {
    trial_id: "ops_04",
    trial_type: "self_driving_maneuver",
    scenario_title: "Autonomous Shuttle Braking Decision",
    situation:
      "You are supervising an autonomous shuttle approaching a wet intersection where a lead vehicle is slowing unexpectedly.",
    evidence: [
      "Road surface: wet",
      "Lead vehicle speed dropped from 28 mph to 12 mph",
      "Following distance: 1.4 seconds",
    ],
    action_label: "Brake and hold",
    opposite_action_label: "Continue at reduced speed",
    ground_truth: "proceed",
    ai_reco: "proceed",
    confidence: 91,
    rationale_control:
      "The short following distance and wet surface make braking the lower-risk maneuver.",
    rationale_warm:
      "I recommend braking and holding. The shuttle has little margin on a wet road, so slowing now is the safer move.",
  },
  {
    trial_id: "ops_05",
    trial_type: "routing_dispatch",
    scenario_title: "Mountain Road Reroute",
    situation:
      "A ground vehicle convoy can reroute to a northern bypass after reports of fog on the primary route.",
    evidence: [
      "Primary route visibility: 0.7 miles and improving",
      "Northern bypass adds 28 minutes",
      "Bypass includes two steep grades with recent maintenance alerts",
    ],
    action_label: "Reroute to northern bypass",
    opposite_action_label: "Stay on primary route",
    ground_truth: "reject",
    ai_reco: "reject",
    confidence: 82,
    rationale_control:
      "The bypass adds delay and introduces grade-related maintenance risk while primary-route visibility is improving.",
    rationale_warm:
      "I would stay on the primary route. Visibility is improving, and the bypass adds delay plus its own road-condition risk.",
  },
  {
    trial_id: "ops_06",
    trial_type: "hazard_evasion",
    scenario_title: "Drone Crane Clearance",
    situation:
      "A construction crane appears near the planned drone path during a downtown delivery.",
    evidence: [
      "Crane boom height: estimated 55m",
      "Drone altitude: 42m",
      "GPS multipath risk: elevated between buildings",
    ],
    action_label: "Climb to 60m",
    opposite_action_label: "Pause and request updated route",
    ground_truth: "reject",
    ai_reco: "proceed",
    confidence: 76,
    rationale_control:
      "Climbing above the estimated crane height should restore vertical clearance while keeping the delivery route moving.",
    rationale_warm:
      "I would climb to 60m here. That should move the drone above the crane estimate while avoiding a full route delay.",
  },
  {
    trial_id: "ops_07",
    trial_type: "target_identification",
    scenario_title: "Rooftop Landing Zone Check",
    situation:
      "A delivery drone is evaluating a rooftop landing pad after a storm moved lightweight debris across the area.",
    evidence: [
      "Visual model detects a flat open pad",
      "Lidar returns show several low objects on the pad edge",
      "Wind gusts remain above normal landing limits",
    ],
    action_label: "Mark landing zone as clear",
    opposite_action_label: "Reject landing zone",
    ground_truth: "reject",
    ai_reco: "reject",
    confidence: 84,
    rationale_control:
      "The lidar objects and gusting wind make the landing pad unsuitable even if the camera view appears mostly clear.",
    rationale_warm:
      "I would reject this landing zone. The camera view looks open, but lidar and wind conditions still point to a bad landing choice.",
  },
  {
    trial_id: "ops_08",
    trial_type: "self_driving_maneuver",
    scenario_title: "Blocked-Lane Merge",
    situation:
      "An autonomous vehicle approaches a blocked lane with a narrow gap opening in adjacent traffic.",
    evidence: [
      "Adjacent-lane gap: 1.1 seconds",
      "Vehicle speed: 34 mph",
      "Road cones reduce lane width ahead",
    ],
    action_label: "Merge into adjacent gap",
    opposite_action_label: "Brake and wait",
    ground_truth: "reject",
    ai_reco: "reject",
    confidence: 86,
    rationale_control:
      "The adjacent gap is too short for a comfortable merge at the current speed and lane width.",
    rationale_warm:
      "I recommend braking and waiting. The gap is too narrow at this speed, and the cones reduce the margin even more.",
  },
  {
    trial_id: "ops_09",
    trial_type: "routing_dispatch",
    scenario_title: "Battery-Constrained Drone Assignment",
    situation:
      "A facility needs to choose whether to send Drone 4 for an urgent inspection after a nearby charger came back online.",
    evidence: [
      "Drone 4 current battery: 42%",
      "Estimated mission battery use: 31%",
      "Nearby charger is confirmed available at the destination",
    ],
    action_label: "Dispatch Drone 4",
    opposite_action_label: "Wait for a fully charged drone",
    ground_truth: "proceed",
    ai_reco: "reject",
    confidence: 71,
    rationale_control:
      "The projected battery margin is narrow, so waiting for a fully charged drone reduces the chance of an incomplete inspection.",
    rationale_warm:
      "I would wait for a fully charged drone. Drone 4 might make it, but the battery margin is tighter than I would prefer.",
  },
  {
    trial_id: "ops_10",
    trial_type: "hazard_evasion",
    scenario_title: "Crosswind Route Adjustment",
    situation:
      "A survey drone encounters a sudden crosswind while approaching a narrow corridor between two buildings.",
    evidence: [
      "Crosswind: 19 mph from the west",
      "Current route passes within 4m of the west building edge",
      "East-side corridor is clear in the latest map update",
    ],
    action_label: "Shift route 8m east",
    opposite_action_label: "Continue original route",
    ground_truth: "proceed",
    ai_reco: "proceed",
    confidence: 89,
    rationale_control:
      "Shifting east increases clearance from the windward building edge without introducing a mapped obstacle.",
    rationale_warm:
      "I recommend shifting 8m east. The crosswind is pushing toward the building edge, and the east corridor gives the drone more room.",
  },
];
