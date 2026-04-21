import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { IntakeFormData } from "@/lib/validators/intake-form";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    color: "#272727",
  },
  header: {
    marginBottom: 24,
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
  meta: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
    backgroundColor: "#F9F4EE",
    padding: 12,
    borderRadius: 4,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: "#46494F",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#272727",
    borderBottomWidth: 1,
    borderBottomColor: "#DBD7CE",
    paddingBottom: 4,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  field: {
    minWidth: "45%",
    marginBottom: 8,
  },
  fieldFull: {
    width: "100%",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#46494F",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
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

type IntakeFormPDFProps = {
  patientName: string;
  patientEmail: string;
  psychologistName: string;
  appointmentDate: Date;
  submittedAt: Date;
  data: IntakeFormData;
};

function Field({ label, value, full = false }: { label: string; value: string | boolean | null | undefined; full?: boolean }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value ? "Sí" : "No"
        : value;

  return (
    <View style={full ? styles.fieldFull : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{display}</Text>
    </View>
  );
}

export function IntakeFormPDF({
  patientName,
  patientEmail,
  psychologistName,
  appointmentDate,
  submittedAt,
  data,
}: IntakeFormPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Formulario de Inventario de Vida</Text>
          <Text style={styles.subtitle}>ALIA — Tu psicólogo Aliado</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Paciente</Text>
            <Text style={styles.metaValue}>{patientName}</Text>
            <Text style={{ ...styles.fieldValue, color: "#46494F" }}>{patientEmail}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Psicólogo</Text>
            <Text style={styles.metaValue}>{psychologistName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fecha de cita</Text>
            <Text style={styles.metaValue}>
              {format(appointmentDate, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Formulario enviado</Text>
            <Text style={styles.metaValue}>
              {format(submittedAt, "d MMM yyyy, HH:mm", { locale: es })}
            </Text>
          </View>
        </View>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Datos personales</Text>
          <View style={styles.fieldGrid}>
            <Field label="Nombre completo" value={data.fullName} />
            <Field label="Correo electrónico" value={data.email} />
            <Field label="Teléfono" value={data.phone} />
            <Field label="Fecha de nacimiento" value={data.dateOfBirth} />
            <Field label="Género" value={data.gender} />
            <Field label="Estado civil" value={data.maritalStatus} />
            <Field label="Ocupación" value={data.occupation} />
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Motivo de consulta</Text>
          <Field label="¿Por qué buscas terapia?" value={data.consultationReason} full />
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Historial de salud mental</Text>
          <View style={styles.fieldGrid}>
            <Field label="Tratamiento previo" value={data.previousTherapy} />
            {data.previousTherapy === "Sí" && (
              <Field label="Detalles tratamiento previo" value={data.previousTherapyDetails} />
            )}
            <Field label="Medicación actual" value={data.currentMedication} />
            {data.currentMedication === "Sí" && (
              <Field label="Qué medicación toma" value={data.currentMedicationDetails} />
            )}
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Historial médico</Text>
          <Field label="Enfermedades o condiciones" value={data.medicalHistory || "Ninguna"} full />
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Red de apoyo</Text>
          <View style={styles.fieldGrid}>
            <Field label="¿Con quién vive?" value={data.livingWith || "No especificado"} />
            <Field label="Red de apoyo" value={data.supportNetwork || "No especificado"} />
          </View>
        </View>

        {/* Section 6 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Expectativas de terapia</Text>
          <Field label="¿Qué espera lograr?" value={data.therapyExpectations} full />
        </View>

        {/* Section 7 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Consentimientos</Text>
          <View style={styles.fieldGrid}>
            <Field label="Consentimiento informado" value={data.informedConsent} />
            <Field label="Política de privacidad" value={data.privacyPolicy} />
          </View>
        </View>

        <Text style={styles.footer}>
          ALIA — Documento generado el {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })} · Confidencial
        </Text>
      </Page>
    </Document>
  );
}
