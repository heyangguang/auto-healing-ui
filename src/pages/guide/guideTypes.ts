import React from 'react';

export interface GuideStep {
  title: string;
  desc: string;
  path: string;
  tips?: string[];
}

export type GuideCategory = 'quick' | 'module' | 'flow';

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  quick: '快速指南',
  module: '功能手册',
  flow: '用户视角指南',
};

export interface GuideArticle {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  category: GuideCategory;
  steps: GuideStep[];
  markdownFile: string;
}
