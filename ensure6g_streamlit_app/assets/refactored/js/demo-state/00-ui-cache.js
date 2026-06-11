const ui = {
  seasonButtons: [],
  stageButtons: [],
  networkButtons: [],
  modeButtons: [],
  presentationWorkflowButton: null,
  stagePanels: [],
  seasonFields: [],
  stageTitle: null,
  stageMessage: null,
  seasonSemanticJson: null,
  congestionLabel: null,
  lossLabel: null,
  delayLabel: null,
  presenterProgressFill: null,
  presenterProgressLabel: null,
  presenterTimerLabel: null,
  presenterCueLabel: null,
  playPauseButton: null,
  presenterBadge: null,
  prevStageButton: null,
  nextStageButton: null,
  resetButton: null,
  stagePanel: null,
  dividerHandle: null,
  presentationWorkflowPanel: null,
  presentationWorkflowTitle: null,
  presentationWorkflowMeta: null,
  presentationWorkflowStep: null,
  presentationWorkflowStage: null,
  presentationWorkflowCue: null,
  presentationWorkflowStart: null,
  presentationWorkflowPrev: null,
  presentationWorkflowNext: null,
  presentationWorkflowClose: null,
  presentationStoryButtons: [],
  mapFrameTitle: null,
  mapFrameMeta: null,
  mapFrameMode: null,
  mapFrameModeMirror: null,
  mapFrameReceiverMirror: null,
  mapFrameReceiver: null,
  ackButtons: [],
  operatorAckPanel: null,
  operatorAckState: null,
  operatorAckMeta: null,
  severityCritical: null,
  severityWarning: null,
  severityNominal: null,
  incidentTickerTrack: null,
  lifecycleItems: [],
  incidentLifecycleHeadline: null,
  incidentSlaClock: null,
  incidentSlaMeta: null,
  dispatchRecommendation: null,
  dispatchState: null,
  dispatchStateDetail: null,
  dispatchStateMeta: null,
  fieldCrewStatus: null,
  fieldCrewEta: null,
  alarmPrimaryItem: null,
  alarmPrimaryTitle: null,
  alarmPrimaryMeta: null,
  communicationModeButtons: [],
  queuePrimaryItem: null,
  queuePrimaryTitle: null,
  queuePrimaryMeta: null,
  receiverValidationSteps: [],
  receiverValidationLabel1: null,
  receiverValidationTitle1: null,
  receiverValidationMeta1: null,
  receiverValidationLabel2: null,
  receiverValidationTitle2: null,
  receiverValidationMeta2: null,
  receiverValidationLabel3: null,
  receiverValidationTitle3: null,
  receiverValidationMeta3: null,
  receiverValidationLabel4: null,
  receiverValidationTitle4: null,
  receiverValidationMeta4: null,
  logEntry1Time: null,
  logEntry1Title: null,
  logEntry1Meta: null,
  logEntry2Time: null,
  logEntry2Title: null,
  logEntry2Meta: null,
  logEntry3Time: null,
  logEntry3Title: null,
  logEntry3Meta: null,
  logEntry4Time: null,
  logEntry4Title: null,
  logEntry4Meta: null,
  operatorNoteText: null,
  drawerTriggers: [],
  mapDrawerHotspot: null,
  dashboardDrawer: null,
  drawerScrim: null,
  drawerClose: null,
  drawerKicker: null,
  drawerTitle: null,
  drawerSubtitle: null,
  drawerStatusChip: null,
  drawerVisualSection: null,
  drawerEvidenceSection: null,
  drawerEvidenceLabel: null,
  drawerEvidenceList: null,
  drawerTrustSection: null,
  drawerTrustLabel: null,
  drawerTrustList: null,
  drawerRecommendationSection: null,
  drawerRecommendationLabel: null,
  drawerRecommendation: null,
  drawerTimelineSection: null,
  drawerTimelineLabel: null,
  drawerTimeline: null,
  semanticReceived: null,
  semanticArrivalPacket: null,
  receiverPolicyNote: null,
  trustCheckDelivery: null,
  trustCheckTrust: null,
  trustCheckPolicy: null
};

function cacheUi() {
  ui.seasonButtons = Array.from(document.querySelectorAll(".season-selector button"));
  ui.stageButtons = Array.from(document.querySelectorAll(".stage-pill"));
  ui.networkButtons = Array.from(document.querySelectorAll(".network-toggle button"));
  ui.modeButtons = Array.from(document.querySelectorAll(".view-mode-toggle button"));
  ui.presentationWorkflowButton = document.getElementById("presentationWorkflowButton");
  ui.stagePanels = Array.from(document.querySelectorAll(".story-stage"));
  ui.seasonFields = Array.from({ length: 4 }, (_, index) => ({
    icon: document.getElementById(`seasonIcon${index + 1}`),
    label: document.getElementById(`seasonLabel${index + 1}`),
    value: document.getElementById(`seasonValue${index + 1}`)
  }));
  ui.stageTitle = document.getElementById("stageTitle");
  ui.stageMessage = document.getElementById("stageMessage");
  ui.seasonSemanticJson = document.getElementById("seasonSemanticJson");
  ui.congestionLabel = document.getElementById("congestionLabel");
  ui.lossLabel = document.getElementById("lossLabel");
  ui.delayLabel = document.getElementById("delayLabel");
  ui.presenterProgressFill = document.getElementById("presenterProgressFill");
  ui.presenterProgressLabel = document.getElementById("presenterProgressLabel");
  ui.presenterTimerLabel = document.getElementById("presenterTimerLabel");
  ui.presenterCueLabel = document.getElementById("presenterCueLabel");
  ui.playPauseButton = document.getElementById("playPauseDemo");
  ui.presenterBadge = document.getElementById("presenterBadge");
  ui.prevStageButton = document.getElementById("prevStage");
  ui.nextStageButton = document.getElementById("nextStage");
  ui.resetButton = document.getElementById("resetDemo");
  ui.stagePanel = document.querySelector(".story-stage-panel");
  ui.dividerHandle = document.getElementById("uxDividerHandle");
  ui.presentationWorkflowPanel = document.getElementById("presentationWorkflowPanel");
  ui.presentationWorkflowTitle = document.getElementById("presentationWorkflowTitle");
  ui.presentationWorkflowMeta = document.getElementById("presentationWorkflowMeta");
  ui.presentationWorkflowStep = document.getElementById("presentationWorkflowStep");
  ui.presentationWorkflowStage = document.getElementById("presentationWorkflowStage");
  ui.presentationWorkflowCue = document.getElementById("presentationWorkflowCue");
  ui.presentationWorkflowStart = document.getElementById("presentationWorkflowStart");
  ui.presentationWorkflowPrev = document.getElementById("presentationWorkflowPrev");
  ui.presentationWorkflowNext = document.getElementById("presentationWorkflowNext");
  ui.presentationWorkflowClose = document.getElementById("presentationWorkflowClose");
  ui.presentationStoryButtons = Array.from(document.querySelectorAll(".presentation-story-jump"));
  ui.mapFrameTitle = document.getElementById("mapFrameTitle");
  ui.mapFrameMeta = document.getElementById("mapFrameMeta");
  ui.mapFrameMode = document.getElementById("mapFrameMode");
  ui.mapFrameModeMirror = document.getElementById("mapFrameModeMirror");
  ui.mapFrameReceiverMirror = document.getElementById("mapFrameReceiverMirror");
  ui.mapFrameReceiver = document.getElementById("mapFrameReceiver");
  ui.ackButtons = Array.from(document.querySelectorAll(".ack-action"));
  ui.operatorAckPanel = document.getElementById("operatorAckPanel");
  ui.operatorAckState = document.getElementById("operatorAckState");
  ui.operatorAckMeta = document.getElementById("operatorAckMeta");
  ui.severityCritical = document.getElementById("severityCritical");
  ui.severityWarning = document.getElementById("severityWarning");
  ui.severityNominal = document.getElementById("severityNominal");
  ui.incidentTickerTrack = document.getElementById("incidentTickerTrack");
  ui.lifecycleItems = Array.from(document.querySelectorAll(".incident-lifecycle-step"));
  ui.incidentLifecycleHeadline = document.getElementById("incidentLifecycleHeadline");
  ui.incidentSlaClock = document.getElementById("incidentSlaClock");
  ui.incidentSlaMeta = document.getElementById("incidentSlaMeta");
  ui.dispatchRecommendation = document.getElementById("dispatchRecommendation");
  ui.dispatchState = document.getElementById("dispatchState");
  ui.dispatchStateDetail = document.getElementById("dispatchStateDetail");
  ui.dispatchStateMeta = document.getElementById("dispatchStateMeta");
  ui.fieldCrewStatus = document.getElementById("fieldCrewStatus");
  ui.fieldCrewEta = document.getElementById("fieldCrewEta");
  ui.alarmPrimaryItem = document.getElementById("alarmPrimaryItem");
  ui.alarmPrimaryTitle = document.getElementById("alarmPrimaryTitle");
  ui.alarmPrimaryMeta = document.getElementById("alarmPrimaryMeta");
  ui.communicationModeButtons = Array.from(document.querySelectorAll(".communication-mode-chip"));
  ui.queuePrimaryItem = document.getElementById("queuePrimaryItem");
  ui.queuePrimaryTitle = document.getElementById("queuePrimaryTitle");
  ui.queuePrimaryMeta = document.getElementById("queuePrimaryMeta");
  ui.receiverValidationSteps = Array.from(document.querySelectorAll(".receiver-validation-step"));
  ui.receiverValidationLabel1 = document.getElementById("receiverValidationLabel1");
  ui.receiverValidationTitle1 = document.getElementById("receiverValidationTitle1");
  ui.receiverValidationMeta1 = document.getElementById("receiverValidationMeta1");
  ui.receiverValidationLabel2 = document.getElementById("receiverValidationLabel2");
  ui.receiverValidationTitle2 = document.getElementById("receiverValidationTitle2");
  ui.receiverValidationMeta2 = document.getElementById("receiverValidationMeta2");
  ui.receiverValidationLabel3 = document.getElementById("receiverValidationLabel3");
  ui.receiverValidationTitle3 = document.getElementById("receiverValidationTitle3");
  ui.receiverValidationMeta3 = document.getElementById("receiverValidationMeta3");
  ui.receiverValidationLabel4 = document.getElementById("receiverValidationLabel4");
  ui.receiverValidationTitle4 = document.getElementById("receiverValidationTitle4");
  ui.receiverValidationMeta4 = document.getElementById("receiverValidationMeta4");
  ui.logEntry1Time = document.getElementById("logEntry1Time");
  ui.logEntry1Title = document.getElementById("logEntry1Title");
  ui.logEntry1Meta = document.getElementById("logEntry1Meta");
  ui.logEntry2Time = document.getElementById("logEntry2Time");
  ui.logEntry2Title = document.getElementById("logEntry2Title");
  ui.logEntry2Meta = document.getElementById("logEntry2Meta");
  ui.logEntry3Time = document.getElementById("logEntry3Time");
  ui.logEntry3Title = document.getElementById("logEntry3Title");
  ui.logEntry3Meta = document.getElementById("logEntry3Meta");
  ui.logEntry4Time = document.getElementById("logEntry4Time");
  ui.logEntry4Title = document.getElementById("logEntry4Title");
  ui.logEntry4Meta = document.getElementById("logEntry4Meta");
  ui.operatorNoteText = document.getElementById("operatorNoteText");
  ui.drawerTriggers = Array.from(document.querySelectorAll("[data-drawer-target]"));
  ui.mapDrawerHotspot = document.getElementById("mapDrawerHotspot");
  ui.dashboardDrawer = document.getElementById("dashboardDrawer");
  ui.drawerScrim = document.getElementById("drawerScrim");
  ui.drawerClose = document.getElementById("drawerClose");
  ui.drawerKicker = document.getElementById("drawerKicker");
  ui.drawerTitle = document.getElementById("drawerTitle");
  ui.drawerSubtitle = document.getElementById("drawerSubtitle");
  ui.drawerStatusChip = document.getElementById("drawerStatusChip");
  ui.drawerVisualSection = document.getElementById("drawerVisualSection");
  ui.drawerEvidenceSection = document.getElementById("drawerEvidenceSection");
  ui.drawerEvidenceLabel = document.getElementById("drawerEvidenceLabel");
  ui.drawerEvidenceList = document.getElementById("drawerEvidenceList");
  ui.drawerTrustSection = document.getElementById("drawerTrustSection");
  ui.drawerTrustLabel = document.getElementById("drawerTrustLabel");
  ui.drawerTrustList = document.getElementById("drawerTrustList");
  ui.drawerRecommendationSection = document.getElementById("drawerRecommendationSection");
  ui.drawerRecommendationLabel = document.getElementById("drawerRecommendationLabel");
  ui.drawerRecommendation = document.getElementById("drawerRecommendation");
  ui.drawerTimelineSection = document.getElementById("drawerTimelineSection");
  ui.drawerTimelineLabel = document.getElementById("drawerTimelineLabel");
  ui.drawerTimeline = document.getElementById("drawerTimeline");
  ui.semanticReceived = document.querySelector(".semantic-received");
  ui.semanticArrivalPacket = document.getElementById("semanticArrivalPacket");
  ui.receiverPolicyNote = document.getElementById("receiverPolicyNote");
  ui.trustCheckDelivery = document.getElementById("trustCheckDelivery");
  ui.trustCheckTrust = document.getElementById("trustCheckTrust");
  ui.trustCheckPolicy = document.getElementById("trustCheckPolicy");
}

function actionShortLabel(action) {
  return action === "issue_tsr" ? "TSR" : String(action || "ACTION").replace(/_/g, " ").toUpperCase();
}

function actionDisplayLabel(action) {
  return action === "issue_tsr" ? "TSR Issued" : actionShortLabel(action);
}
