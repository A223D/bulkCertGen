import { getAllTemplates, getTemplateById } from "./template-registry.ts";

export type SampleCsv = {
  templateId: string;
  fileName: string;
  csv: string;
};

export const SAMPLE_CSVS: SampleCsv[] = [
  {
    templateId: "classic-certificate",
    fileName: "classic-certificate-sample.csv",
    csv: [
      "name,course,date,issuer",
      "Jane Smith,Intro to Python,2026-06-15,Very Simple Academy",
      "John Lee,Intro to Python,2026-06-15,Very Simple Academy",
    ].join("\n"),
  },
  {
    templateId: "name-badge",
    fileName: "name-badge-sample.csv",
    csv: [
      "name,role,company,group",
      "Jane Smith,Designer,Acme Studio,Table 4",
      "John Lee,Founder,North Labs,Table 7",
    ].join("\n"),
  },
  {
    templateId: "mailing-label",
    fileName: "mailing-label-sample.csv",
    csv: [
      "name,address_line_1,address_line_2,city,region,postal_code",
      "Jane Smith,123 Main St,Apt 4,Toronto,ON,M5V 1A1",
      "John Lee,55 Queen St,,Mississauga,ON,L5B 2N5",
    ].join("\n"),
  },
  {
    templateId: "appointment-card",
    fileName: "appointment-card-sample.csv",
    csv: [
      "name,date,time,location,notes",
      "Jane Smith,2026-06-15,10:30 AM,Main Office,Bring ID",
      "John Lee,2026-06-16,2:00 PM,Main Office,Arrive 10 minutes early",
    ].join("\n"),
  },
];

export function getAllSampleCsvs(): SampleCsv[] {
  return [...SAMPLE_CSVS];
}

export function getSampleCsvByTemplateId(templateId: string): SampleCsv | null {
  return SAMPLE_CSVS.find((sample) => sample.templateId === templateId) ?? null;
}

export function assertAllTemplatesHaveSampleCsvs(): void {
  for (const template of getAllTemplates()) {
    const sample = getSampleCsvByTemplateId(template.id);

    if (!sample) {
      throw new Error(`Missing sample CSV for template: ${template.id}`);
    }

    if (!getTemplateById(sample.templateId)) {
      throw new Error(`Unknown sample CSV template: ${sample.templateId}`);
    }
  }
}
