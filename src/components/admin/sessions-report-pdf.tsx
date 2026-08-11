import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrencyAmount } from "@/lib/currency";
import type { SessionsReportPsychologist } from "@/lib/admin/report-queries";

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 9,
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 48,
        color: "#272727",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#DBD4C2",
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 11,
        color: "#46494F",
    },
    rangeLabel: {
        fontSize: 10,
        color: "#46494F",
        marginTop: 6,
    },
    psychologistBlock: {
        marginBottom: 22,
    },
    psychologistName: {
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#272727",
        borderBottomWidth: 1,
        borderBottomColor: "#DBD7CE",
        paddingBottom: 4,
    },
    table: {
        width: "100%",
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#F9F4EE",
        paddingVertical: 5,
        paddingHorizontal: 6,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 5,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#DBD7CE",
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#46494F",
        textTransform: "uppercase",
    },
    tableCell: {
        fontSize: 9,
    },
    colDate: { width: "20%" },
    colPatient: { width: "34%" },
    colStatus: { width: "16%" },
    colPayment: { width: "16%" },
    colAmount: { width: "14%", textAlign: "right" },
    totalsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 16,
        marginTop: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: "#DBD4C2",
    },
    totalsItem: {
        alignItems: "flex-end",
    },
    totalsLabel: {
        fontSize: 8,
        color: "#46494F",
        textTransform: "uppercase",
    },
    totalsValuePaid: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#047857",
    },
    totalsValuePending: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#B45309",
    },
    emptyState: {
        fontSize: 10,
        color: "#46494F",
        fontStyle: "italic",
        marginTop: 20,
    },
    footer: {
        position: "absolute",
        bottom: 24,
        left: 48,
        right: 48,
        textAlign: "center",
        fontSize: 8,
        color: "#46494F",
        borderTopWidth: 1,
        borderTopColor: "#DBD7CE",
        paddingTop: 8,
    },
});

const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
};

type SessionsReportPDFProps = {
    psychologists: SessionsReportPsychologist[];
    dateFrom: string;
    dateTo: string;
    scopeLabel: string;
};

export function SessionsReportPDF({
    psychologists,
    dateFrom,
    dateTo,
    scopeLabel,
}: SessionsReportPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Reporte de sesiones y pagos</Text>
                    <Text style={styles.subtitle}>ALIA — Tu psicólogo Aliado</Text>
                    <Text style={styles.rangeLabel}>
                        {`${scopeLabel} · ${format(new Date(`${dateFrom}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: es })} — ${format(new Date(`${dateTo}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: es })}`}
                    </Text>
                </View>

                {psychologists.length === 0 && (
                    <Text style={styles.emptyState}>
                        No se encontraron sesiones confirmadas o completadas en este rango.
                    </Text>
                )}

                {psychologists.map((psychologist) => (
                    <View
                        key={psychologist.id}
                        style={styles.psychologistBlock}
                        wrap={false}
                    >
                        <Text style={styles.psychologistName}>{psychologist.name}</Text>

                        <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.tableHeaderCell, styles.colDate]}>
                                    Fecha
                                </Text>
                                <Text style={[styles.tableHeaderCell, styles.colPatient]}>
                                    Paciente
                                </Text>
                                <Text style={[styles.tableHeaderCell, styles.colStatus]}>
                                    Sesión
                                </Text>
                                <Text style={[styles.tableHeaderCell, styles.colPayment]}>
                                    Pago
                                </Text>
                                <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                                    Monto
                                </Text>
                            </View>

                            {psychologist.sessions.map((session) => (
                                <View key={session.id} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colDate]}>
                                        {format(session.dateTime, "d MMM yyyy", { locale: es })}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colPatient]}>
                                        {session.patientName}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colStatus]}>
                                        {APPOINTMENT_STATUS_LABEL[session.status]}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colPayment]}>
                                        {session.isPaid ? "Pagada" : "Pendiente"}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colAmount]}>
                                        {session.amount != null && session.currency
                                            ? formatCurrencyAmount(session.amount, session.currency)
                                            : "—"}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.totalsRow}>
                            {psychologist.totalsByCurrency.length === 0 && (
                                <Text style={styles.totalsLabel}>
                                    Sin cobros generados para estas sesiones
                                </Text>
                            )}
                            {psychologist.totalsByCurrency.map((t) => (
                                <View key={t.currency} style={styles.totalsItem}>
                                    <Text style={styles.totalsLabel}>
                                        {`Pagado (${t.paidCount})`}
                                    </Text>
                                    <Text style={styles.totalsValuePaid}>
                                        {formatCurrencyAmount(t.paidAmount, t.currency)}
                                    </Text>
                                    <Text style={[styles.totalsLabel, { marginTop: 4 }]}>
                                        {`Pendiente (${t.pendingCount})`}
                                    </Text>
                                    <Text style={styles.totalsValuePending}>
                                        {formatCurrencyAmount(t.pendingAmount, t.currency)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) =>
                        `ALIA — Documento generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })} · Confidencial · Página ${pageNumber} de ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
}
