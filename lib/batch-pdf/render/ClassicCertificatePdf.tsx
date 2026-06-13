import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MappedDocumentData } from "../types.ts";
import { getPdfValue, OptionalPdfText } from "./pdf-utils";

const styles = StyleSheet.create({
  page: {
    padding: 42,
    fontFamily: "Helvetica",
    backgroundColor: "#fbfaf7",
  },
  frame: {
    border: "2 solid #d8ccb8",
    height: "100%",
    padding: 34,
    alignItems: "center",
    justifyContent: "space-between",
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "#4b4034",
  },
  label: {
    fontSize: 13,
    color: "#6f665d",
    marginBottom: 10,
  },
  name: {
    fontSize: 34,
    color: "#1f1b16",
  },
  course: {
    fontSize: 22,
    color: "#1f1b16",
    marginTop: 8,
  },
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#5f574f",
  },
});

export function ClassicCertificatePdf({ data }: { data: MappedDocumentData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View>
            <Text style={styles.title}>Certificate of Completion</Text>
          </View>
          <View>
            <Text style={styles.label}>Presented to</Text>
            <Text style={styles.name}>{getPdfValue(data, "name")}</Text>
          </View>
          <View>
            <Text style={styles.label}>for</Text>
            <Text style={styles.course}>{getPdfValue(data, "course")}</Text>
          </View>
          <View style={styles.footer}>
            <Text>Date: {getPdfValue(data, "date")}</Text>
            <OptionalPdfText value={data.issuer} prefix="Issued by: " />
          </View>
        </View>
      </Page>
    </Document>
  );
}
