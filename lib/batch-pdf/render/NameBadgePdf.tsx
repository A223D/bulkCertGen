import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MappedDocumentData } from "../types.ts";
import { getPdfValue } from "./pdf-utils";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    backgroundColor: "#f7f4ee",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    width: 330,
    minHeight: 205,
    border: "1.5 solid #d8ccb8",
    backgroundColor: "#fbfaf7",
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#9b4a1b",
  },
  headerText: {
    color: "#fffaf0",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  name: {
    fontSize: 30,
    color: "#1f1b16",
    marginBottom: 16,
    lineHeight: 1.1,
  },
  nameCompact: {
    fontSize: 23,
  },
  detail: {
    gap: 3,
  },
  detailLine: {
    fontSize: 13,
    color: "#5f574f",
    lineHeight: 1.18,
  },
});

export function NameBadgePdf({ data }: { data: MappedDocumentData }) {
  const name = getPdfValue(data, "name");
  const detailLines = [data.role, data.company, data.group]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return (
    <Document>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <View style={styles.badge}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Event Badge</Text>
          </View>
          <View style={styles.body}>
            <Text style={[styles.name, name.length > 26 ? styles.nameCompact : {}]}>
              {name}
            </Text>
            <View style={styles.detail}>
              {detailLines.map((line) => (
                <Text key={line} style={styles.detailLine}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
