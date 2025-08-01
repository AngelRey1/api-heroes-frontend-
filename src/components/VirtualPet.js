import React, { useState, useEffect } from 'react';
import { 
    feedPet, 
    waterPet, 
    playWithPet, 
    walkPet, 
    bathePet, 
    sleepPet, 
    wakePet, 
    petPet, 
    healPet, 
    getPetStatus 
} from '../api';
import './VirtualPet.css';

const VirtualPet = ({ pet, token, onUpdate }) => {
    const [petStats, setPetStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        if (pet && token) {
            loadPetStats();
            // Actualizar stats cada 30 segundos
            const interval = setInterval(loadPetStats, 30000);
            return () => clearInterval(interval);
        }
    }, [pet, token]);

    const loadPetStats = async () => {
        try {
            const stats = await getPetStatus(token, pet._id);
            setPetStats(stats);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error cargando stats de mascota:', error);
        }
    };

    const handleAction = async (action, params = {}) => {
        if (loading) return;
        
        setLoading(true);
        setMessage('');
        
        try {
            let result;
            switch (action) {
                case 'feed':
                    result = await feedPet(token, pet._id);
                    break;
                case 'water':
                    result = await waterPet(token, pet._id);
                    break;
                case 'play':
                    result = await playWithPet(token, pet._id);
                    break;
                case 'walk':
                    result = await walkPet(token, pet._id);
                    break;
                case 'bathe':
                    result = await bathePet(token, pet._id);
                    break;
                case 'sleep':
                    result = await sleepPet(pet._id, token);
                    break;
                case 'wake':
                    result = await wakePet(token, pet._id);
                    break;
                case 'pet':
                    result = await petPet(token, pet._id);
                    break;
                case 'heal':
                    result = await healPet(token, pet._id);
                    break;
                default:
                    throw new Error('Acción no válida');
            }
            
            setPetStats(result);
            setMessage(getActionMessage(action));
            if (onUpdate) onUpdate();
            
            // Limpiar mensaje después de 3 segundos
            setTimeout(() => setMessage(''), 3000);
            
        } catch (error) {
            console.error(`Error en acción ${action}:`, error);
            setMessage(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    const getActionMessage = (action) => {
        const messages = {
            feed: '¡Mascota alimentada! 🍽️',
            water: '¡Mascota hidratada! 💧',
            play: '¡Mascota jugó! 🎾',
            walk: '¡Mascota paseó! 🦮',
            bathe: '¡Mascota bañada! 🛁',
            sleep: '¡Mascota durmiendo! 😴',
            wake: '¡Mascota despierta! ⏰',
            pet: '¡Mascota acariciada! ❤️',
            heal: '¡Mascota curada! 🩹'
        };
        return messages[action] || 'Acción completada';
    };

    const getMoodIcon = (mood) => {
        const icons = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            excited: '🤩',
            tired: '😴',
            hungry: '🍽️',
            thirsty: '💧',
            dirty: '🤢',
            sick: '🤒',
            sleepy: '😴'
        };
        return icons[mood] || '😊';
    };

    const getStatusColor = (value) => {
        if (value >= 80) return '#4CAF50'; // Verde
        if (value >= 60) return '#FF9800'; // Naranja
        if (value >= 40) return '#FFC107'; // Amarillo
        return '#F44336'; // Rojo
    };

    const getStatusText = (value) => {
        if (value >= 80) return 'Excelente';
        if (value >= 60) return 'Bueno';
        if (value >= 40) return 'Regular';
        if (value >= 20) return 'Bajo';
        return 'Crítico';
    };

    if (!pet) {
        return <div className="virtual-pet">Selecciona una mascota para cuidarla</div>;
    }

    if (loading && !petStats) {
        return <div className="virtual-pet">Cargando estado de la mascota...</div>;
    }

    return (
        <div className="virtual-pet">
            <div className="pet-header">
                <div className="pet-avatar-container">
                    <div 
                        className="pet-avatar" 
                        style={{ 
                            boxShadow: `0 0 20px ${pet.glowColor || '#FF69B4'}`
                        }}
                    >
                        {pet.avatar ? (
                            <img src={pet.avatar} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
                                <circle cx="35" cy="40" r="5" fill="#000"/>
                                <circle cx="65" cy="40" r="5" fill="#000"/>
                                <circle cx="50" cy="55" r="3" fill="#FF6B6B"/>
                                <path d="M 40 65 Q 50 75 60 65" stroke="#000" strokeWidth="2" fill="none"/>
                                <ellipse cx="30" cy="25" rx="8" ry="12" fill="#FFD700"/>
                                <ellipse cx="70" cy="25" rx="8" ry="12" fill="#FFD700"/>
                            </svg>
                        )}
                    </div>
                </div>
                <div className="pet-info">
                    <h3 className="pet-name">{pet.name}</h3>
                    <div className="pet-details">
                        <span><strong>Tipo:</strong> {pet.type}</span>
                        <span><strong>Poder:</strong> {pet.superPower}</span>
                        <span><strong>Personalidad:</strong> {pet.personality}</span>
                        <span className="life-status">
                            <span className="status-indicator" style={{ backgroundColor: pet.status === 'Viva' ? '#4CAF50' : '#F44336' }}></span>
                            {pet.status}
                        </span>
                    </div>
                </div>
            </div>

            {message && (
                <div className="message-toast">
                    {message}
                </div>
            )}

            {petStats && (
                <div className="pet-stats">
                    <div className="stats-header">
                        <span className="mood-display">
                            {getMoodIcon(petStats.mood)} {petStats.mood}
                        </span>
                        {petStats.isSleeping && <span className="sleeping-indicator">💤 Durmiendo</span>}
                    </div>
                    
                                         <div className="stats-bars">
                         <div className="stat-bar">
                             <label>Salud: {petStats.health}%</label>
                             <div className="bar-container">
                                 <div 
                                     className="bar-fill" 
                                     style={{ 
                                         width: `${petStats.health}%`,
                                         backgroundColor: getStatusColor(petStats.health)
                                     }}
                                 />
                             </div>
                             <span className="stat-text">{getStatusText(petStats.health)}</span>
                         </div>

                         <div className="stat-bar">
                             <label>Felicidad: {petStats.happiness}%</label>
                             <div className="bar-container">
                                 <div 
                                     className="bar-fill" 
                                     style={{ 
                                         width: `${petStats.happiness}%`,
                                         backgroundColor: getStatusColor(petStats.happiness)
                                     }}
                                 />
                             </div>
                             <span className="stat-text">{getStatusText(petStats.happiness)}</span>
                         </div>

                         <div className="stat-bar">
                             <label>Energía: {petStats.energy}%</label>
                             <div className="bar-container">
                                 <div 
                                     className="bar-fill" 
                                     style={{ 
                                         width: `${petStats.energy}%`,
                                         backgroundColor: getStatusColor(petStats.energy)
                                     }}
                                 />
                             </div>
                             <span className="stat-text">{getStatusText(petStats.energy)}</span>
                         </div>

                         <div className="stat-bar">
                             <label>Sueño: {petStats.sleep}%</label>
                             <div className="bar-container">
                                 <div 
                                     className="bar-fill" 
                                     style={{ 
                                         width: `${petStats.sleep}%`,
                                         backgroundColor: getStatusColor(petStats.sleep)
                                     }}
                                 />
                             </div>
                             <span className="stat-text">{getStatusText(petStats.sleep)}</span>
                         </div>

                         <div className="stat-bar">
                             <label>Hambre: {petStats.hunger}%</label>
                             <div className="bar-container">
                                 <div 
                                     className="bar-fill" 
                                     style={{ 
                                         width: `${petStats.hunger}%`,
                                         backgroundColor: getStatusColor(100 - petStats.hunger)
                                     }}
                                 />
                             </div>
                             <span className="stat-text">{getStatusText(100 - petStats.hunger)}</span>
                         </div>

                         <div className="stat-bar">
                             <label>Limpieza: {petStats.cleanliness}%</label>
                             <div className="bar-container">
                                 <div 
                                     className="bar-fill" 
                                     style={{ 
                                         width: `${petStats.cleanliness}%`,
                                         backgroundColor: getStatusColor(petStats.cleanliness)
                                     }}
                                 />
                             </div>
                             <span className="stat-text">{getStatusText(petStats.cleanliness)}</span>
                         </div>
                     </div>
                </div>
            )}

            <div className="pet-actions">
                <h4>Acciones de Cuidado</h4>
                                 <div className="action-buttons">
                     <button 
                         onClick={() => handleAction('sleep')} 
                         disabled={loading || petStats?.isSleeping || petStats?.status === 'Muerta'} 
                         className="action-btn sleep"
                         title={petStats?.isSleeping ? 'Ya está durmiendo' : 'Recupera energía y reduce sueño'}
                     >
                         😴 Dormir
                     </button>
                     <button 
                         onClick={() => handleAction('play')} 
                         disabled={loading || petStats?.energy < 10 || petStats?.status === 'Muerta'} 
                         className="action-btn play"
                         title={petStats?.energy < 10 ? 'Necesita más energía para jugar' : 'Aumenta felicidad pero gasta energía y ensucia'}
                     >
                         🎾 Jugar
                     </button>
                     <button 
                         onClick={() => handleAction('feed')} 
                         disabled={loading || petStats?.status === 'Muerta'} 
                         className="action-btn feed"
                         title="Reduce hambre y aumenta salud"
                     >
                         🍽️ Alimentar
                     </button>
                     <button 
                         onClick={() => handleAction('bathe')} 
                         disabled={loading || petStats?.status === 'Muerta'} 
                         className="action-btn bathe"
                         title="Aumenta limpieza y felicidad"
                     >
                         🛁 Bañar
                     </button>
                     <button 
                         onClick={() => handleAction('pet')} 
                         disabled={loading || petStats?.status === 'Muerta'} 
                         className="action-btn pet"
                         title="Aumenta felicidad y reduce estrés"
                     >
                         ❤️ Acariciar
                     </button>
                     <button 
                         onClick={() => handleAction('heal')} 
                         disabled={loading || petStats?.status === 'Muerta'} 
                         className="action-btn heal"
                         title="Cura enfermedades y aumenta salud"
                     >
                         🩹 Curar
                     </button>
                 </div>
                
                {petStats?.isSleeping && (
                    <button 
                        onClick={() => handleAction('wake')} 
                        disabled={loading || petStats?.status === 'Muerta'} 
                        className="action-btn wake"
                    >
                        ⏰ Despertar
                    </button>
                )}

                                 <div className="action-info">
                     <p>💡 Consejos de Jugabilidad:</p>
                     <ul>
                         <li><strong>🍽️ Alimentar:</strong> Reduce hambre, aumenta salud</li>
                         <li><strong>🎾 Jugar:</strong> Aumenta felicidad, gasta energía, ensucia</li>
                         <li><strong>🛁 Bañar:</strong> Aumenta limpieza y felicidad</li>
                         <li><strong>😴 Dormir:</strong> Recupera energía, reduce sueño</li>
                         <li><strong>❤️ Acariciar:</strong> Aumenta felicidad, reduce estrés</li>
                         <li><strong>🩹 Curar:</strong> Cura enfermedades, aumenta salud</li>
                         <li><strong>⚡ Energía:</strong> Necesaria para jugar y actividades</li>
                         <li><strong>⚠️ Cuidado:</strong> Stats bajos pueden causar enfermedades</li>
                     </ul>
                 </div>
            </div>

            <div className="last-update">
                Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>
        </div>
    );
};

export default VirtualPet; 