import { Text, View } from "@react-pdf/renderer";

interface SummaryProps {
  amount: number;
  tax?: number;
  vat?: number;
  currency: string;
  totalLabel: string;
  taxLabel: string;
  vatLabel: string;
}

export function Summary({
  amount,
  tax,
  vat,
  currency,
  totalLabel,
  taxLabel,
  vatLabel,
}: SummaryProps) {
  const formatAmount = ({ currency, amount }: { currency: string; amount: number }) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };
  return (
    <View
      style={{
        marginTop: 60,
        marginBottom: 40,
        alignItems: "flex-end",
        alignSelf: "flex-end",
        width: 250,
      }}
    >
      {tax && (
        <View style={{ flexDirection: "row", marginBottom: 5 }}>
          <Text style={{ fontSize: 9, flex: 1 }}>{taxLabel}</Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {formatAmount({ currency, amount: tax })}
          </Text>
        </View>
      )}

      {vat && (
        <View style={{ flexDirection: "row", marginBottom: 5 }}>
          <Text style={{ fontSize: 9, flex: 1 }}>{vatLabel}</Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {formatAmount({ currency, amount: vat })}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          marginTop: 5,
          borderTopWidth: 0.5,
          borderTopColor: "#000",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 5,
        }}
      >
        <Text style={{ fontSize: 9, marginRight: 10 }}>{totalLabel}</Text>
        <Text style={{ fontSize: 21 }}>
          {formatAmount({ currency, amount })}
        </Text>
      </View>
    </View>
  );
}
