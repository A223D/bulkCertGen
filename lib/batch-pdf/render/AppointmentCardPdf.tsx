import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MappedDocumentData } from "../types.ts";
import { getPdfValue } from "./pdf-utils";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    backgroundColor: "#f7f4ee",
  },
  card: {
    border: "1.5 solid #d8ccb8",
    backgroundColor: "#fbfaf7",
    padding: 24,
    width: 340,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6f665d",
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    color: "#1f1b16",
    marginBottom: 18,
    lineHeight: 1.15,
  },
  nameCompact: {
    fontSize: 18,
  },
  block: {
    border: "1 solid #e6ddce",
    padding: 10,
    marginTop: 8,
  },
  blockLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6f665d",
    marginBottom: 5,
  },
  blockText: {
    fontSize: 12,
    color: "#1f1b16",
    lineHeight: 1.35,
  },
  blockTextCompact: {
    fontSize: 10,
  },
});

export function AppointmentCardPdf({ data }: { data: MappedDocumentData }) {
  const name = getPdfValue(data, "name");
  const location = getPdfValue(data, "location");
  const notes = data.notes?.trim();

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.label}>Appointment Reminder</Text>
          <Text style={[styles.name, name.length > 30 ? styles.nameCompact : {}]}>
            {name}
          </Text>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Date and time</Text>
            <Text style={styles.blockText}>
              {getPdfValue(data, "date")} at {getPdfValue(data, "time")}
            </Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Location</Text>
            <Text style={[styles.blockText, location.length > 70 ? styles.blockTextCompact : {}]}>
              {location}
            </Text>
          </View>
          {notes ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Notes</Text>
              <Text style={[styles.blockText, notes.length > 90 ? styles.blockTextCompact : {}]}>
                {notes}
              </Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
