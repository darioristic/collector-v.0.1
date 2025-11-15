/**
 * Meta information component for PDF (Invoice number, dates)
 */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { TemplateConfig } from "./types";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  leftColumn: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Courier",
  },
  dateRow: {
    marginBottom: 4,
    fontFamily: "Courier",
    fontSize: 11,
  },
  label: {
    color: "#878787",
    fontFamily: "Courier",
  },
  value: {
    fontWeight: "medium",
    fontFamily: "Courier",
  },
});

interface MetaProps {
  template: TemplateConfig;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
}

export function Meta({ template, invoiceNumber, issueDate, dueDate }: MetaProps) {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <Text style={styles.invoiceNumber}>
          Invoice NO: {invoiceNumber}
        </Text>
        <View style={styles.dateRow}>
          <Text style={styles.label}>Issue date: </Text>
          <Text style={styles.value}>{formatDate(issueDate)}</Text>
        </View>
        {dueDate && (
          <View style={styles.dateRow}>
            <Text style={styles.label}>Due date: </Text>
            <Text style={styles.value}>{formatDate(dueDate)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

