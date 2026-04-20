import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface NewAppointmentNotificationEmailProps {
  psychologistName: string;
  patientName: string;
  patientEmail: string;
  formattedDate: string;
  duration: number;
  intakeFormUrl: string;
  logoUrl: string;
  logoLightUrl: string;
  fontUrl: string;
}

export function NewAppointmentNotificationEmail({
  psychologistName,
  patientName,
  patientEmail,
  formattedDate,
  duration,
  intakeFormUrl,
  logoUrl,
  logoLightUrl,
  fontUrl,
}: NewAppointmentNotificationEmailProps) {
  return (
    <Html lang="es">
      <Head>
        <Font
          fontFamily="Robecha Daniera"
          fallbackFontFamily={["Georgia", "serif"]}
          webFont={{ url: fontUrl, format: "truetype" }}
          fontWeight={400}
          fontStyle="normal"
        />
        <style>{`
          .logo-dark  { display: block !important; }
          .logo-light { display: none  !important; }
          @media (prefers-color-scheme: dark) {
            .logo-dark  { display: none  !important; }
            .logo-light { display: block !important; }
          }
        `}</style>
      </Head>
      <Preview>Nueva cita agendada — {patientName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl}      className="logo-dark"  height={52} alt="ALIA" style={logoStyle} />
            <Img src={logoLightUrl} className="logo-light" height={52} alt="ALIA" style={{ ...logoStyle, display: "none" }} />
            <Text style={tagline}>Tu psicólogo aliado</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Nueva cita agendada
            </Heading>
            <Text style={intro}>
              Hola {psychologistName}, tienes una nueva sesión confirmada.
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>Paciente</Text>
              <Text style={cardValue}>{patientName}</Text>
              <Text style={cardEmail}>{patientEmail}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Fecha y hora</Text>
              <Text style={cardValue}>{formattedDate}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Duración</Text>
              <Text style={cardValue}>{duration} minutos</Text>
            </Section>

            <Text style={hint}>
              Revisa el formulario de inventario de vida del paciente antes de
              la sesión.
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button href={intakeFormUrl} style={accentButton}>
                Ver formulario del paciente
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>© 2025 ALIA — Tu psicólogo aliado</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NewAppointmentNotificationEmail;

const body: React.CSSProperties = {
  backgroundColor: "#F9F4EE",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0",
  padding: "0",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "48px 24px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "36px",
};

const logoStyle: React.CSSProperties = {
  margin: "0 auto 8px",
  display: "block",
};

const tagline: React.CSSProperties = {
  fontSize: "13px",
  color: "#46494F",
  margin: "0",
  textAlign: "center",
  letterSpacing: "0.04em",
};

const content: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "40px 36px",
  marginBottom: "24px",
};

const heading: React.CSSProperties = {
  fontFamily: "'Robecha Daniera', Georgia, serif",
  fontSize: "26px",
  fontWeight: "400",
  color: "#272727",
  margin: "0 0 12px 0",
  textAlign: "center",
};

const intro: React.CSSProperties = {
  fontSize: "15px",
  color: "#46494F",
  lineHeight: "1.6",
  margin: "0 0 28px 0",
  textAlign: "center",
};

const card: React.CSSProperties = {
  backgroundColor: "#F9F4EE",
  borderRadius: "10px",
  padding: "20px 24px",
  margin: "0 0 24px 0",
};

const cardLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#46494F",
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  margin: "0 0 3px 0",
};

const cardValue: React.CSSProperties = {
  fontSize: "16px",
  color: "#272727",
  fontWeight: "500",
  margin: "0",
};

const cardEmail: React.CSSProperties = {
  fontSize: "13px",
  color: "#46494F",
  margin: "2px 0 0 0",
};

const divider: React.CSSProperties = {
  borderColor: "#DBD4C2",
  margin: "14px 0",
};

const hint: React.CSSProperties = {
  fontSize: "14px",
  color: "#46494F",
  lineHeight: "1.5",
  margin: "0 0 20px 0",
  textAlign: "center",
};

const accentButton: React.CSSProperties = {
  backgroundColor: "#EAACA7",
  color: "#272727",
  borderRadius: "8px",
  padding: "13px 28px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#46494F",
  margin: "0 0 4px 0",
};
