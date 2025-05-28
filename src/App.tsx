import { useEffect, useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_URL = 'https://pubsub-api-549920649116.us-central1.run.app/';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0d1117',
      paper: 'rgba(30, 40, 60, 0.6)',
    },
    primary: {
      main: '#4f81ff',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8c63ff',
    },
    success: {
      main: '#4ade80',
    },
    text: {
      primary: '#c9d1d9',
      secondary: '#8b95a1',
    },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
});

function App() {
  const [view, setView] = useState<'home' | 'detector'>('home');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        sx={{
          background: 'rgba(20, 30, 48, 0.9)',
          boxShadow: '0 0 10px 2px rgba(100, 125, 255, 0.3)',
          borderBottom: '1px solid #2a2f45',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div">
            Detector de Phishing
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          minHeight: '100vh',
          px: 4,
          background: 'radial-gradient(circle at top left, #0d1117, #161b22 60%, #0d1117 100%)',
          color: 'text.primary',
          width: '100%',
        }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Box textAlign="center" maxWidth={600} mx="auto">
                <Typography variant="h3" gutterBottom>
                  Bienvenido
                </Typography>
                <Typography variant="h6" color="textSecondary" paragraph>
                  Esta aplicación usa reconocimiento de voz y análisis de texto para identificar posibles mensajes de phishing.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => setView('detector')}
                  sx={{ fontWeight: 'bold', textTransform: 'none' }}
                >
                  Comenzar detección
                </Button>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              style={{
                width: '100%',
              }}
              data-key="detector"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <Dictaphone />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </ThemeProvider>
  );
}

export default App;

interface Response {
  score: number;
  reason: string;
}

const Dictaphone = () => {
  const [result, setResult] = useState<Response | null>(null);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    setEditableTranscript(transcript);
  }, [transcript, listening]);

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Mic permission granted');
    } catch (err) {
      console.log('Mic permission denied or error:', err);
    }
  };

  const startListening = async () => {
    await requestMicPermission();
    console.log('Mic permission granted');
    console.log('Starting listening');
    SpeechRecognition.startListening({
      continuous: true,
      language: 'es-ES',
    });
  };

  const postVerification = async () => {
    if (editableTranscript.length === 0) return;
    setIsLoading(true);

    const response = await fetch(`${API_URL}/analize-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editableTranscript }),
    });

    const data: Response = await response.json();
    setResult(data);
    setIsLoading(false);
  };

  const handleReset = () => {
    setEditableTranscript('');
    resetTranscript();
  };

  if (!browserSupportsSpeechRecognition) {
    return <Typography>Tu navegador no soporta reconocimiento de voz.</Typography>;
  }

  const isDisabled = isLoading || editableTranscript.length === 0;
  const isValidScore = result && result.score < 0.75;

  return (
    <Box pt={2} display="flex" flexDirection="column" gap={2} width="100%" maxWidth={700} mx="auto">
      <Typography variant="h5" gutterBottom>
        Detección de Phishing por Voz o Texto.
      </Typography>

      {listening && (
        <Typography variant="body1" gutterBottom>
          Escuchando...
        </Typography>
      )}

      <Box display="flex" gap={2} flexWrap="wrap" mb={2} justifyContent="space-between">
        <motion.div whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
          <Button variant="contained" color="primary" fullWidth onClick={startListening}>
            Iniciar
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
          <Button variant="contained" color="secondary" fullWidth onClick={() => SpeechRecognition.stopListening()}>
            Detener
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
          <Button variant="outlined" fullWidth onClick={handleReset}>
            Limpiar
          </Button>
        </motion.div>
      </Box>

      <TextField
        multiline
        rows={6}
        fullWidth
        label="Texto transcrito"
        value={editableTranscript}
        onChange={(e) => setEditableTranscript(e.target.value)}
        margin="normal"
        sx={{
          backgroundColor: 'rgba(40, 50, 75, 0.5)',
          borderRadius: 2,
          '& .MuiInputBase-root': {
            color: '#c9d1d9',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(100, 125, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4f81ff',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4f81ff',
          },
        }}
      />

      <Tooltip
        title={editableTranscript.length === 0 ? 'Escribe un mensaje para verificar' : 'Verificar posible phishing'}
        placement="top"
        disableInteractive={isDisabled}
      >
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={postVerification}
            sx={{ mt: 2 }}
            disabled={isDisabled}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <CircularProgress size={30} sx={{ color: '#4f81ff' }} />
              </motion.div>
            ) : (
              'Verificar posible phishing'
            )}
          </Button>
        </motion.div>
      </Tooltip>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box mt={4}>
            <Typography fontWeight={900} fontSize={20} variant="body1" color="text.secondary">
              Calificación: {result.score}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Razón: {result.reason}
            </Typography>
          </Box>
        </motion.div>
      )}

      {isValidScore && (
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="outlined"
            onClick={() => {
              navigator.clipboard.writeText(editableTranscript);
            }}
          >
            Alertar a administradores
          </Button>
        </motion.div>
      )}
    </Box>
  );
};