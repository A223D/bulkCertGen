import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MappedDocumentData } from "../types.ts";
import { getPdfValue, OptionalPdfText } from "./pdf-utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Courier",
    backgroundColor: "#fbfaf7",
  },
  label: {
    border: "1.5 dashed #d8ccb8",
    padding: 24,
    width: 360,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#1f1b16",
  },
  labelCompact: {
    fontSize: 11,
  },
  name: {
    fontWeight: "bold",
  },
});

export function MailingLabelPdf({ data }: { data: MappedDocumentData }) {
  const addressLength = [
    data.name,
    data.address_line_1,
    data.address_line_2,
    data.city,
    data.region,
    data.postal_code,
  ].join(" ").length;

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={[styles.label, addressLength > 150 ? styles.labelCompact : {}]}>
          <Text style={styles.name}>{getPdfValue(data, "name")}</Text>
          <Text>{getPdfValue(data, "address_line_1")}</Text>
          <OptionalPdfText value={data.address_line_2} />
          <Text>
            {getPdfValue(data, "city")}, {getPdfValue(data, "region")}{" "}
            {getPdfValue(data, "postal_code")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
