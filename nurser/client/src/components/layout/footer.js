const DashboardFooter = () => (
  <footer style={{
    padding: '1rem',
    textAlign: 'center',
    marginTop: '2rem',
    borderTop: '1px solid #eee'
  }}>
    <p>© {new Date().getFullYear()} Nurse Duty Manager</p>
    <div style={{ marginTop: '0.5rem' }}>
      <IconButton href="https://wa.me/..." size="small">
        <WhatsAppIcon fontSize="small" />
      </IconButton>
      <IconButton href="mailto:support@..." size="small">
        <EmailIcon fontSize="small" />
      </IconButton>
    </div>
  </footer>
);