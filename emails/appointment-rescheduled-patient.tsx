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

interface AppointmentRescheduledPatientEmailProps {
  patientName: string;
  psychologistName: string;
  formattedDate: string;
  duration: number;
  appointmentsUrl: string;
  googleCalendarUrl: string;
  logoUrl: string;
  logoLightUrl: string;
  fontUrl: string;
}

export function AppointmentRescheduledPatientEmail({
  patientName,
  psychologistName,
  formattedDate,
  duration,
  appointmentsUrl,
  googleCalendarUrl,
  logoUrl,
  logoLightUrl,
  fontUrl,
}: AppointmentRescheduledPatientEmailProps) {
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
      <Preview>Tu cita con {psychologistName} fue reagendada</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl}      className="logo-dark"  height={52} alt="ALIA" style={logoStyle} />
            <Img src={logoLightUrl} className="logo-light" height={52} alt="ALIA" style={{ ...logoStyle, display: "none" }} />
            <Text style={tagline}>Tu psicólogo aliado</Text>
          </Section>

          <Section style={content}>
            <Section style={badge}>
              <Text style={badgeText}>Cita reagendada</Text>
            </Section>

            <Heading as="h2" style={heading}>
              Nueva fecha para tu sesión
            </Heading>
            <Text style={intro}>
              Hola {patientName}, tu cita con {psychologistName} fue reagendada
              a la siguiente fecha.
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>Psicólogo</Text>
              <Text style={cardValue}>{psychologistName}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Nueva fecha y hora</Text>
              <Text style={cardValue}>{formattedDate}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Duración</Text>
              <Text style={cardValue}>{duration} minutos</Text>
            </Section>

            <Section style={actions}>
              <Button href={appointmentsUrl} style={primaryButton}>
                Ver mis citas
              </Button>
              <Button href={googleCalendarUrl} style={calendarButton}>
                + Agregar a Google Calendar
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Si tienes preguntas, responde este correo.
            </Text>
            <Text style={footerText}>© 2025 ALIA — Tu psicólogo aliado</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AppointmentRescheduledPatientEmail;

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
  textAlign: "center",
};

const badge: React.CSSProperties = {
  backgroundColor: "#DBD4C2",
  borderRadius: "20px",
  display: "inline-block",
  padding: "4px 14px",
  marginBottom: "20px",
};

const badgeText: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#272727",
  margin: "0",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
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
  margin: "0 0 28px 0",
  textAlign: "left",
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

const divider: React.CSSProperties = {
  borderColor: "#DBD4C2",
  margin: "14px 0",
};

const actions: React.CSSProperties = {
  textAlign: "center",
};

const primaryButton: React.CSSProperties = {
  backgroundColor: "#272727",
  color: "#FFFFFF",
  borderRadius: "8px",
  padding: "13px 28px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: "12px",
};

const calendarButton: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#272727",
  borderRadius: "8px",
  padding: "11px 24px",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  display: "inline-block",
  border: "1.5px solid #272727",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#46494F",
  margin: "0 0 4px 0",
};
