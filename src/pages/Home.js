import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useSoundEffects } from '../components/SoundEffects';
import NotificationToast from '../components/NotificationToast';
import './Home.css';

const Home = () => {
  const { token, user, activePet, fetchUserData } = useUser();
  const { playClick, playFeed, playClean, playPlay, playSleep } = useSoundEffects();
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    if (user && token) {
      fetchUserData();
    }
  }, [user, token]);

  useEffect(() => {
    if (activePet) {
      checkPetStatus();
      checkDiseases(); // Verificar enfermedades automáticamente
    }
  }, [activePet]);

  const checkAbandonment = () => {
    if (!activePet || !activePet.lastCare) return;
    
    const lastCare = new Date(activePet.lastCare);
    const now = new Date();
    const hoursSinceLastCare = (now - lastCare) / (1000 * 60 * 60);
    
    if (hoursSinceLastCare > 24) {
      setNotification({
        message: '⚠️ Tu mascota necesita atención urgente!',
        type: 'warning'
      });
    }
  };

  const checkPetStatus = () => {
    if (activePet) {
      const now = new Date();
      const lastCare = new Date(activePet.lastCare);
      const hoursSinceCare = (now - lastCare) / (1000 * 60 * 60);
      
      if (hoursSinceCare > 24 && activePet.health < 50) {
        setNotification({
          message: '¡Tu mascota necesita atención! Ha pasado mucho tiempo sin cuidado.',
          type: 'warning'
        });
      }
    }
  };

  // Verificar enfermedades automáticamente
  const checkDiseases = async () => {
    if (!activePet || !token) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://api-heroes-gh4i.onrender.com/api';
      
      const response = await fetch(`${API_URL}/pet-care/${activePet._id}/check-disease`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.message.includes('enfermado')) {
          setNotification({
            message: result.message,
            type: 'warning'
          });
          await fetchUserData(); // Recargar datos
        }
      }
    } catch (error) {
      console.error('Error verificando enfermedades:', error);
    }
  };

  const handlePetAction = async (action, actionName) => {
    if (!activePet || !token) return;
    
    try {
      console.log(`${actionName} mascota:`, activePet._id);
      
      const API_URL = process.env.REACT_APP_API_URL || 'https://api-heroes-gh4i.onrender.com/api';
      
      const response = await fetch(`${API_URL}/pet-care/${activePet._id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log(`Resultado ${actionName}:`, result);
      
      if (!response.ok) {
        // Si es un error 400, puede ser una consecuencia (como indigestión)
        if (response.status === 400 && result.message) {
          setNotification({
            message: result.message,
            type: 'warning'
          });
          return;
        }
        throw new Error(result.error || `Error al ${actionName.toLowerCase()}`);
      }
      
      // Mostrar notificación con consecuencias
      let notificationMessage = result.message;
      let notificationType = 'success';
      
      // Agregar información de consecuencias
      if (result.consequences) {
        const { healthChange, happinessChange, energyChange, diseasesCured } = result.consequences;
        
        let consequencesText = '';
        if (healthChange !== 0) {
          consequencesText += `Salud: ${healthChange > 0 ? '+' : ''}${healthChange} `;
        }
        if (happinessChange !== 0) {
          consequencesText += `Felicidad: ${happinessChange > 0 ? '+' : ''}${happinessChange} `;
        }
        if (energyChange !== 0) {
          consequencesText += `Energía: ${energyChange > 0 ? '+' : ''}${energyChange}`;
        }
        
        if (consequencesText) {
          notificationMessage += ` (${consequencesText})`;
        }
        
        // Si hay enfermedades curadas, mostrar en verde
        if (diseasesCured && diseasesCured.length > 0) {
          notificationMessage += ` 🏥 Enfermedades curadas: ${diseasesCured.join(', ')}`;
        }
        
        // Si hay consecuencias negativas, cambiar tipo de notificación
        if (healthChange < 0 || happinessChange < 0 || energyChange < 0) {
          notificationType = 'warning';
        }
      }
      
      setNotification({
        message: notificationMessage,
        type: notificationType
      });
      
      // Actualizar datos de la mascota
      if (result.pet) {
        await fetchUserData(); // Recargar datos del usuario y mascotas
      }
      
      // Reproducir sonido específico
      switch (action) {
        case 'feed':
          playFeed();
          break;
        case 'bath':
          playClean();
          break;
        case 'play':
          playPlay();
          break;
        case 'sleep':
          playSleep();
          break;
        case 'heal':
          playFeed(); // Usar sonido de feed para curación
          break;
        default:
          playClick();
      }
      
    } catch (error) {
      console.error(`Error ${actionName.toLowerCase()}:`, error);
      setNotification({
        message: `Error ${actionName.toLowerCase()}: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleAlimentar = () => handlePetAction('feed', 'Alimentar');
  const handleJugar = () => handlePetAction('play', 'Jugar');
  const handleLimpiar = () => handlePetAction('bath', 'Limpiar');
  const handleDormir = () => handlePetAction('sleep', 'Dormir');
  const handleCurar = () => handlePetAction('heal', 'Curar');

  if (!user) {
    return (
      <div className="home-container">
        <div className="welcome-message">
          <h1>¡Bienvenido a tu Aventura Virtual!</h1>
          <p>Inicia sesión para comenzar a cuidar de tus mascotas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Información del usuario */}
        <div className="user-details">
          <div className="user-info">
            <h2>👤 {user.username}</h2>
          </div>
        </div>

        {/* Panel principal de la mascota */}
        <div className="pet-main-panel">
          {/* Mascota central */}
          <div className="pet-display">
            <div className="pet-avatar">
              {activePet?.type === 'dog' ? '🐕' : 
               activePet?.type === 'cat' ? '🐱' : 
               activePet?.type === 'rabbit' ? '🐰' : 
               activePet?.type === 'bird' ? '🐦' : 
               activePet?.type === 'hamster' ? '🐹' : 
               activePet?.type === 'turtle' ? '🐢' : '🐾'}
            </div>
            <h3 className="pet-name">{activePet?.name || 'Sin mascota'}</h3>
            <p className="pet-type">Tipo: {activePet?.type || 'N/A'}</p>
            <p className="pet-power">Poder: {activePet?.superPower || 'N/A'}</p>
            <div className="pet-status">
              <span className="status-dot"></span>
              <span className="status-text">Viva</span>
            </div>
          </div>

          {/* Estadísticas de la mascota */}
          <div className="pet-stats-panel">
            <div className="stat-bar">
              <span className="stat-icon">❤️</span>
              <span className="stat-label">Salud:</span>
              <div className="stat-progress">
                <div className="stat-fill health-fill" style={{ width: `${activePet?.health || 0}%` }}></div>
              </div>
              <span className="stat-value">{activePet?.health || 0}%</span>
            </div>
            
            <div className="stat-bar">
              <span className="stat-icon">😊</span>
              <span className="stat-label">Felicidad:</span>
              <div className="stat-progress">
                <div className="stat-fill happiness-fill" style={{ width: `${activePet?.happiness || 0}%` }}></div>
              </div>
              <span className="stat-value">{activePet?.happiness || 0}%</span>
            </div>
            
            <div className="stat-bar">
              <span className="stat-icon">⚡</span>
              <span className="stat-label">Energía:</span>
              <div className="stat-progress">
                <div className="stat-fill energy-fill" style={{ width: `${activePet?.energy || 0}%` }}></div>
              </div>
              <span className="stat-value">{activePet?.energy || 0}%</span>
            </div>
          </div>
        </div>

        {/* Botones de cuidado */}
        <div className="care-actions">
          <div className="care-row">
            <button className="care-btn" onClick={handleDormir}>
              <span className="care-icon">😴</span>
              <span className="care-text">Dormir</span>
            </button>
            <button className="care-btn" onClick={handleJugar}>
              <span className="care-icon">✨</span>
              <span className="care-text">Jugar</span>
            </button>
            <button className="care-btn" onClick={handleAlimentar}>
              <span className="care-icon">🍎</span>
              <span className="care-text">Alimentar</span>
            </button>
          </div>
          <div className="care-row">
            <button className="care-btn" onClick={handleLimpiar}>
              <span className="care-icon">🛁</span>
              <span className="care-text">Bañar</span>
            </button>
            <button className="care-btn" onClick={handleCurar}>
              <span className="care-icon">🏥</span>
              <span className="care-text">Curar</span>
            </button>
            <button className="care-btn">
              <span className="care-icon">🤚</span>
              <span className="care-text">Acariciar</span>
            </button>
          </div>
        </div>
      </div>

      {notification.message && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
};

export default Home; 