export type RootParamList = {
  // Auth
  Login: undefined;
  Signup: undefined;
  ContextSwitcher: undefined;
  
  // Servant tabs
  Home: undefined;
  Attendance: undefined;
  Tasks: undefined;
  Taiao: undefined;
  SwitchContext: undefined;
  
  // Servant hidden tabs
  Preparations: undefined;
  FollowUp: undefined;
  Achievements: undefined;
  Library: undefined;
  Notifications: undefined;
  TaskDetail: { taskId: string };
  
  // Service Leader tabs
  Reviews: undefined;
  Reports: undefined;
  ServantManagement: undefined;
  ClassManagement: undefined;
  StudentsManagement: undefined;
  
  // Follow-up stack
  FollowUpList: undefined;
  FollowUpDetail: { familyId: string };
  AddActivity: undefined;
  CreateFollowUp: undefined;
  ManageGroups: undefined;
  Monitoring: undefined;
  AttentionList: undefined;
  
  // Leader
  PreparationsReview: undefined;
  
  // Events
  Events: undefined;
  
  // Parent
  ParentDashboard: undefined;
  
  // Priest
  PriestDashboard: undefined;
};