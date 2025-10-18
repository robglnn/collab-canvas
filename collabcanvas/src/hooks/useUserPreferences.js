import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook to manage user-specific preferences
 * Currently supports custom colors (5 slots)
 * 
 * @param {string} userId - Current user's ID
 * @returns {Object} - { customColors, saveCustomColor, loading }
 */
export function useUserPreferences(userId) {
  const [customColors, setCustomColors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user preferences from Firestore
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const prefsRef = doc(db, 'users', userId);
        const prefsSnap = await getDoc(prefsRef);

        if (prefsSnap.exists()) {
          const data = prefsSnap.data();
          setCustomColors(data.customColors || []);
        } else {
          // Initialize with empty custom colors
          setCustomColors([]);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        setCustomColors([]);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  /**
   * Save a custom color to a specific slot (0-4)
   * @param {number} slotIndex - Index of custom color slot (0-4)
   * @param {string} color - Hex color code (e.g., "#FF0000")
   */
  const saveCustomColor = async (slotIndex, color) => {
    if (!userId) {
      console.error('Cannot save custom color: no user ID');
      return;
    }

    if (slotIndex < 0 || slotIndex > 4) {
      console.error('Invalid slot index:', slotIndex);
      return;
    }

    try {
      // Update local state
      const updatedColors = [...customColors];
      updatedColors[slotIndex] = color;
      setCustomColors(updatedColors);

      // Save to Firestore
      const prefsRef = doc(db, 'users', userId);
      await setDoc(prefsRef, {
        customColors: updatedColors,
        updatedAt: new Date(),
      }, { merge: true });

      console.log(`Custom color saved to slot ${slotIndex}:`, color);
    } catch (error) {
      console.error('Error saving custom color:', error);
    }
  };

  return {
    customColors,
    saveCustomColor,
    loading,
  };
}

