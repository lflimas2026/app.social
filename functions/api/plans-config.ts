// plans-config.ts
export interface PlanFeatures {
  socialNetworksLimit: number;
  schedulingsLimit: number;
  autoPosting: number; // 0 = false, 1 = true
  adsManager: number;  // 0 = false, 1 = true
  aiOptimization: number; // 0 = false, 1 = true
  geminiIntegration: number; // 0 = false, 1 = true
  exportableReports: number; // 0 = false, 1 = true
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: PlanFeatures;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Plano Free',
    price: 0,
    features: {
      socialNetworksLimit: 1,
      schedulingsLimit: 10,
      autoPosting: 0,
      adsManager: 0,
      aiOptimization: 0,
      geminiIntegration: 0,
      exportableReports: 0
    }
  },
  starter: {
    id: 'starter',
    name: 'Plano Starter',
    price: 99.00,
    features: {
      socialNetworksLimit: 3,
      schedulingsLimit: 999999,
      autoPosting: 1,
      adsManager: 1,
      aiOptimization: 1,
      geminiIntegration: 0,
      exportableReports: 0
    }
  },
  professional: {
    id: 'professional',
    name: 'Plano Professional',
    price: 149.00,
    features: {
      socialNetworksLimit: 6,
      schedulingsLimit: 999999,
      autoPosting: 1,
      adsManager: 1,
      aiOptimization: 1,
      geminiIntegration: 1,
      exportableReports: 1
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plano Enterprise',
    price: 499.00,
    features: {
      socialNetworksLimit: 20,
      schedulingsLimit: 999999,
      autoPosting: 1,
      adsManager: 1,
      aiOptimization: 1,
      geminiIntegration: 1,
      exportableReports: 1
    }
  }
};

export const getDefaultFeaturesForPlan = (planId: string): PlanFeatures => {
  const plan = PLANS[planId.toLowerCase()];
  if (plan) return plan.features;
  return PLANS.free.features;
};
