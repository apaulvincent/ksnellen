import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet, Text,
  TouchableOpacity,
  TVEventHandler,
  View
} from 'react-native';

const LETTERS = ['C', 'D', 'E', 'F', 'L', 'N', 'O', 'P', 'T', 'Z'];
const DEFAULT_SETTINGS = {
  topFontSize: 160,
  textColor: '#ffffff',
  bgColor: '#000000',
  fontFamily: 'Snellen',
  letterSpacing: 10,
  verticalSpacing: 18,
};

const ROW_CONFIG = [
  { count: 1, scale: 1.0 },
  { count: 2, scale: 0.6 },
  { count: 3, scale: 0.4 },
  { count: 4, scale: 0.3 },
  { count: 5, scale: 0.25 },
  { count: 6, scale: 0.20 },
  { count: 7, scale: 0.15 },
  { count: 8, scale: 0.125 }
];

export default function App() {
  const [fontsLoaded] = useFonts({
    'Snellen': require('./assets/fonts/Snellen.ttf'),
    'Sloan': require('./assets/fonts/Sloan.ttf'),
  });

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [lettersData, setLettersData] = useState([]);
  const [gearFocused, setGearFocused] = useState(false);
  
  const settingsVisibleRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(500)).current;

  const toggleSettings = useCallback((visible) => {
    settingsVisibleRef.current = visible;
    if (visible) {
      setShowSettings(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowSettings(false));
    }
  }, [slideAnim]);
  
  const generateLetters = useCallback(() => {
    const newLetters = ROW_CONFIG.map(row => {
      let rowLetters = '';
      for (let i = 0; i < row.count; i++) {
        rowLetters += LETTERS[Math.floor(Math.random() * LETTERS.length)] + (i < row.count -1 ? ' ' : '');
      }
      return { ...row, text: rowLetters };
    });
    setLettersData(newLetters);
  }, []);

  useEffect(() => {
    generateLetters();
    loadSettings();
  }, [generateLetters]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      const handleTVRemote = (cmp, event) => {
        if (event && (event.eventType === 'menu' || event?.eventType === 'playPause' || event?.eventType === 'longSelect')) {
          toggleSettings(!settingsVisibleRef.current);
        }
      };
      let tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(undefined, handleTVRemote);
      return () => tvEventHandler.disable();
    } catch(e) {
      console.warn('TVEventHandler not supported');
    }
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('snellen_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem('snellen_settings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.loading}><Text style={{color: '#fff'}}>Loading Fonts...</Text></View>;
  }

  const OptionButton = ({ label, onPress, selected }) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
      <TouchableOpacity 
        style={[styles.btn, selected && styles.btnSelected, isFocused && styles.tvFocus]} 
        onPress={onPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, selected && styles.btnTextSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const CloseButton = ({ onPress }) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
      <TouchableOpacity 
        style={[styles.btn, styles.closeBtn, isFocused && styles.tvFocus]} 
        onPress={onPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>Close Drawer</Text>
      </TouchableOpacity>
    );
  };

  const ColorButton = ({ color, onPress, selected }) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
      <TouchableOpacity 
        style={[
          styles.colorBtn, 
          { backgroundColor: color },
          selected && styles.colorBtnSelected,
          isFocused && styles.tvFocus
        ]} 
        onPress={onPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        activeOpacity={0.7}
      />
    );
  };

  const Stepper = ({ label, value, onChange, step = 1, min = 0, max = 100 }) => {
    const [isMinusFocused, setIsMinusFocused] = useState(false);
    const [isPlusFocused, setIsPlusFocused] = useState(false);
    
    return (
      <View style={styles.settingGroup}>
        <Text style={styles.settingLabel}>{label} ({value.toFixed(0)})</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity 
            style={[styles.stepBtn, isMinusFocused && styles.tvFocus]} 
            onFocus={() => setIsMinusFocused(true)}
            onBlur={() => setIsMinusFocused(false)}
            onPress={() => onChange(Math.max(min, value - step))}
          >
            <Text style={styles.stepBtnText}>-</Text>
          </TouchableOpacity>
          <View style={styles.stepValueBox}>
            <Text style={styles.stepValueText}>{value.toFixed(0)}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.stepBtn, isPlusFocused && styles.tvFocus]} 
            onFocus={() => setIsPlusFocused(true)}
            onBlur={() => setIsPlusFocused(false)}
            onPress={() => onChange(Math.min(max, value + step))}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: settings.bgColor }]}>
      <StatusBar hidden />
      
      <View style={styles.chartContainer}>
        {lettersData.map((row, index) => (
          <View 
            key={index} 
            style={styles.rowWrapper}
          >
            <View style={[styles.rowContent, { paddingVertical: settings.verticalSpacing }]}>
              <Text 
                style={[
                  styles.rowNumber, 
                  { 
                    color: '#ffffff',
                    fontSize: 32
                  }
                ]}
              >
                {index + 1}
              </Text>
              
              <Text 
                style={[
                  styles.rowText, 
                  { 
                    fontSize: settings.topFontSize * row.scale,
                    color: settings.textColor,
                    fontFamily: settings.fontFamily,
                    letterSpacing: settings.letterSpacing * (0.5 + index * 0.5),
                    lineHeight: settings.topFontSize * row.scale,
                  }
                ]}
              >
                {row.text}
              </Text>
            </View>
            <View 
              style={[
                styles.rowDivider, 
                { backgroundColor: settings.textColor }
              ]} 
            />
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.gearButton, gearFocused && styles.tvFocus]} 
        onPress={() => toggleSettings(true)}
        onFocus={() => setGearFocused(true)}
        onBlur={() => setGearFocused(false)}
      >
        <Ionicons name="settings" size={32} color={settings.textColor} style={{ opacity: 0.6 }} />
      </TouchableOpacity>

      <Modal visible={showSettings} transparent animationType="none" onRequestClose={() => toggleSettings(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.overlayDismiss} 
            activeOpacity={1} 
            focusable={false}
            onPress={() => toggleSettings(false)} 
          />
          <Animated.View style={[styles.settingsPanel, { transform: [{ translateX: slideAnim }] }]}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <ScrollView>
              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Actions</Text>
                <OptionButton label="Randomize Letters" onPress={generateLetters} />
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Font Type</Text>
                <View style={styles.rowWrap}>
                  {['Snellen', 'Sloan', 'monospace'].map(f => (
                    <OptionButton 
                      key={f} 
                      label={f} 
                      selected={settings.fontFamily === f}
                      onPress={() => saveSettings({ fontFamily: f })} 
                    />
                  ))}
                </View>
              </View>

              <Stepper 
                label="Letter Spacing" 
                value={settings.letterSpacing} 
                onChange={(val) => saveSettings({ letterSpacing: val })} 
              />

              <Stepper 
                label="Vertical Spacing" 
                value={settings.verticalSpacing} 
                onChange={(val) => saveSettings({ verticalSpacing: val })} 
              />

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Top Font Size ({settings.topFontSize})</Text>
                <View style={styles.rowWrap}>
                  <OptionButton label="Smaller (-10)" onPress={() => saveSettings({ topFontSize: Math.max(50, settings.topFontSize - 10) })} />
                  <OptionButton label="Larger (+10)" onPress={() => saveSettings({ topFontSize: Math.min(300, settings.topFontSize + 10) })} />
                </View>
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Text Color</Text>
                <View style={styles.rowWrap}>
                  {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(color => (
                    <ColorButton 
                      key={color} 
                      color={color} 
                      selected={settings.textColor === color}
                      onPress={() => saveSettings({ textColor: color })} 
                    />
                  ))}
                </View>
              </View>

              <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Background Color</Text>
                <View style={styles.rowWrap}>
                  {['#000000', '#ffffff', '#222222', '#1a1a2e', '#f4f4f4', '#001f3f'].map(color => (
                    <ColorButton 
                      key={color} 
                      color={color} 
                      selected={settings.bgColor === color}
                      onPress={() => saveSettings({ bgColor: color })} 
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <CloseButton onPress={() => toggleSettings(false)} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    width: '100%',
    flex: 1,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  rowWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  rowNumber: {
    position: 'absolute',
    left: 40,
    fontWeight: 'bold',
  },
  rowText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rowDivider: {
    width: '80%',
    height: 1,
    opacity: 0.15,
  },
  gearButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
  },
  overlayDismiss: {
    flex: 1,
  },
  settingsPanel: {
    width: 500,
    maxWidth: '90%',
    height: '100%',
    backgroundColor: '#2e2e2e',
    padding: 32,
    paddingTop: 40,
    elevation: 8,
  },
  settingsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
    fontWeight: '600',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  btn: {
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  btnSelected: {
    borderColor: '#4DA8DA',
    backgroundColor: '#334a7a',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnTextSelected: {
    color: '#4DA8DA',
  },
  colorBtn: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorBtnSelected: {
    borderColor: '#4DA8DA',
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#e63946',
    alignItems: 'center',
    marginBottom: 0,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  stepValueBox: {
    flex: 1,
    height: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValueText: {
    color: '#4DA8DA',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tvFocus: {
    borderColor: '#ffffff',
    borderWidth: 4,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    transform: [{ scale: 1.05 }],
  }
});
