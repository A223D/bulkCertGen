import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MappedDocumentData } from "../types.ts";
import { getPdfValue, OptionalPdfText } from "./pdf-utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#f7f4ee",
  },
  badge: {
    width: 300,
    minHeight: 190,
    border: "1.5 solid #d8ccb8",
    backgroundColor: "#fbfaf7",
  },
  header: {
    padding: 14,
    backgroundColor: "#9b4a1b",
  },
  headerText: {
    color: "#fffaf0",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  body: {
    padding: 22,
  },
  name: {
    fontSize: 28,
    color: "#1f1b16",
    marginBottom: 14,
  },
  detail: {
    fontSize: 12,
    color: "#5f574f",
    marginTop: 4,
  },
});

export function NameBadgePdf({ data }: { data: MappedDocumentData }) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.badge}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Event Badge</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{getPdfValue(data, "name")}</Text>
            <View style={styles.detail}>
              <OptionalPdfText value={data.role} />
              <OptionalPdfText value={data.company} />
              <OptionalPdfText value={data.group} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
