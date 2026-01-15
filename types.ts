
export enum ArticleTopic {
  CONFERENCE = 'Hội nghị/Hoạt động',
  INCIDENT = 'Vụ việc',
  OTHER = 'Khác'
}

export enum ArticleLength {
  SHORT = 'Ngắn',
  MEDIUM = 'Trung bình',
  LONG = 'Dài'
}

export interface ArticleConfig {
  abbreviateVictim: boolean;
  abbreviateSubject: boolean;
  customTemplate?: string;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  tags: string[];
}
