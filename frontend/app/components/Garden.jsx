import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

const GentleGardenGame = () => {
  // Enhanced game state
  const [plants, setPlants] = useState([
    { id: 1, name: 'Rose', growth: 0, needsWater: true, lastWatered: null, 
      growthRate: 1, waterNeed: 1, happiness: 5, description: 'Beautiful and fragrant', unlockedAt: 1 },
    { id: 2, name: 'Tulip', growth: 0, needsWater: true, lastWatered: null,
      growthRate: 1.2, waterNeed: 0.8, happiness: 3, description: 'Cheerful spring flower', unlockedAt: 1 },
    { id: 3, name: 'Sunflower', growth: 0, needsWater: true, lastWatered: null, 
      growthRate: 0.8, waterNeed: 1.5, happiness: 4, description: 'Tall and sunny', unlockedAt: 1 },
  ]);
  
  // Locked plants that can be unlocked
  const [lockedPlants, setLockedPlants] = useState([
    { id: 4, name: 'Lavender', growth: 0, needsWater: true, lastWatered: null, 
      growthRate: 0.7, waterNeed: 0.6, happiness: 4, description: 'Aromatic and calming', unlockedAt: 3, cost: 50 },
    { id: 5, name: 'Cactus', growth: 0, needsWater: true, lastWatered: null, 
      growthRate: 0.5, waterNeed: 0.3, happiness: 2, description: 'Drought resistant', unlockedAt: 5, cost: 100 },
    { id: 6, name: 'Orchid', growth: 0, needsWater: true, lastWatered: null, 
      growthRate: 1.5, waterNeed: 1.2, happiness: 7, description: 'Exotic and elegant', unlockedAt: 7, cost: 200 },
  ]);

  // Game resources and state
  const [dayCount, setDayCount] = useState(1);
  const [message, setMessage] = useState('Welcome to your garden!');
  const [coins, setCoins] = useState(20);
  const [waterSupply, setWaterSupply] = useState(5);
  const [fertilizer, setFertilizer] = useState(1);
  const [gardenLevel, setGardenLevel] = useState(1);
  const [gardenHappiness, setGardenHappiness] = useState(0);
  const [weather, setWeather] = useState('sunny'); // sunny, rainy, or drought
  
  // UI state
  const [showStore, setShowStore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeEffect, setActiveEffect] = useState(null);
  
  // Animated values
  const shakeAnimation = new Animated.Value(0);
  const wateringAnimation = new Animated.Value(0);

  // Growth stages for plants - expanded with more detail
  const growthStages = [
    '🌱', // Seed
    '🌿', // Small sprout
    '🍃', // Growing
    '🌷', // Budding
    '🌺', // Blooming
  ];

  // Plant emojis by type
  const plantEmojis = {
    'Rose': ['🌱', '🌿', '🍃', '🥀', '🌹'],
    'Tulip': ['🌱', '🌿', '🍃', '🌷', '🌷'],
    'Sunflower': ['🌱', '🌿', '🍃', '🌻', '🌻'],
    'Lavender': ['🌱', '🌿', '🌾', '💜', '💜'],
    'Cactus': ['🌱', '🌵', '🌵', '🌵', '🏜️'],
    'Orchid': ['🌱', '🌿', '🍃', '🪷', '🪷'],
  };

  // Weather types and effects
  const weatherTypes = {
    'sunny': { icon: '☀️', waterModifier: 1, growthModifier: 1 },
    'rainy': { icon: '🌧️', waterModifier: 0, growthModifier: 1.5 },
    'drought': { icon: '🔥', waterModifier: 2, growthModifier: 0.5 },
    'cloudy': { icon: '☁️', waterModifier: 0.8, growthModifier: 0.8 },
  };

  // Sound effects
  const soundEffects = {
    water: null,
    harvest: null,
    newDay: null, 
    purchase: null,
  };

  // Load sounds
  useEffect(() => {
    // This would use actual sound files in a real implementation
    const loadSounds = async () => {
      // In real implementation: 
      // soundEffects.water = await Audio.Sound.createAsync(require('./assets/sounds/water.mp3'));
      console.log('Sounds would be loaded here');
    };
    
    loadSounds();
    
    // Clean up sounds on unmount
    return () => {
      Object.values(soundEffects).forEach(sound => {
        if (sound) sound.unloadAsync(); 
      });
    };
  }, []);

  // Water a plant
  const waterPlant = (id) => {
    if (waterSupply <= 0) {
      setNotification("You're out of water! Wait for next day.");
      playShakeAnimation();
      return;
    }
    
    setPlants(plants.map(plant => {
      if (plant.id === id && plant.needsWater) {
        // Show watering message
        setMessage(`You watered the ${plant.name}!`);
        setWaterSupply(prev => prev - 1);
        
        // Play water animation
        playWaterAnimation();
        
        // Play water sound
        if (soundEffects.water) {
          soundEffects.water.replayAsync();
        }
        
        // Update plant
        return {
          ...plant,
          needsWater: false,
          lastWatered: new Date(),
        };
      }
      return plant;
    }));
  };

  // Apply fertilizer to a plant
  const applyFertilizer = (id) => {
    if (fertilizer <= 0) {
      setNotification("You're out of fertilizer!");
      playShakeAnimation();
      return;
    }
    
    setPlants(plants.map(plant => {
      if (plant.id === id) {
        // Apply growth boost, limited to max growth
        const newGrowth = Math.min(plant.growth + 1, 4);
        
        setFertilizer(prev => prev - 1);
        setMessage(`You applied fertilizer to the ${plant.name}!`);
        
        setActiveEffect({
          plantId: id,
          effect: 'fertilize',
          time: Date.now()
        });
        
        return {
          ...plant,
          growth: newGrowth,
        };
      }
      return plant;
    }));
  };

  // Advance to next day
  const advanceDay = () => {
    // Generate random weather for the next day
    const weatherOptions = Object.keys(weatherTypes);
    const newWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    setWeather(newWeather);
    
    // Update day count
    setDayCount(dayCount + 1);
    setMessage(`Day ${dayCount + 1}: The weather is ${newWeather}.`);
    
    // Refill water based on weather
    const weatherWaterMod = weatherTypes[newWeather].waterModifier;
    const baseWaterRefill = 5;
    setWaterSupply(Math.min(10, waterSupply + baseWaterRefill * weatherWaterMod));
    
    // Award daily coins
    const dailyCoins = 5 + Math.floor(gardenHappiness / 2);
    setCoins(coins + dailyCoins);
    
    // Check for special events
    if (dayCount % 7 === 0) {
      const bonusFertilizer = 1;
      setFertilizer(fertilizer + bonusFertilizer);
      setNotification(`Weekly bonus: +${bonusFertilizer} fertilizer!`);
    }
    
    // Grow plants and make them need water again
    setPlants(plants.map(plant => {
      // Plants that were watered will grow
      const wasWatered = !plant.needsWater;
      
      // Calculate growth based on plant type and weather
      const weatherGrowthMod = weatherTypes[newWeather].growthModifier;
      const growthIncrement = wasWatered ? plant.growthRate * weatherGrowthMod : 0;
      
      // Calculate new growth stage (max 4)
      const newGrowth = wasWatered && plant.growth < 4 
        ? Math.min(plant.growth + growthIncrement, 4) 
        : plant.growth;
      
      // If plant is fully grown, it stays watered for visual purposes
      const newNeedsWater = newGrowth < 4 ? true : false;
      
      return {
        ...plant,
        growth: newGrowth,
        needsWater: newNeedsWater,
        lastWatered: newNeedsWater ? null : plant.lastWatered,
      };
    }));
    
    // Update garden happiness
    updateGardenHappiness();
    
    // Check for level up
    checkForLevelUp();
    
    // Play new day sound
    if (soundEffects.newDay) {
      soundEffects.newDay.replayAsync();
    }
  };

  // Update overall garden happiness
  const updateGardenHappiness = () => {
    const totalHappiness = plants.reduce((total, plant) => {
      // Fully grown plants contribute maximum happiness
      if (plant.growth >= 4) {
        return total + plant.happiness;
      }
      // Growing plants contribute partial happiness
      return total + (plant.happiness * (plant.growth / 4));
    }, 0);
    
    setGardenHappiness(totalHappiness);
  };

  // Check if garden level should increase
  const checkForLevelUp = () => {
    const newLevel = Math.floor(gardenHappiness / 10) + 1;
    
    if (newLevel > gardenLevel) {
      setGardenLevel(newLevel);
      setNotification(`Your garden reached level ${newLevel}! New plants available!`);
      // Check for newly unlocked plants
      checkForUnlocks(newLevel);
    }
  };

  // Check for plant unlocks based on new level
  const checkForUnlocks = (level) => {
    const newUnlocks = lockedPlants.filter(plant => plant.unlockedAt <= level);
    
    if (newUnlocks.length > 0) {
      setNotification(`New plants available in the store: ${newUnlocks.map(p => p.name).join(', ')}!`);
    }
  };

  // Purchase a plant from the store
  const purchasePlant = (plantId) => {
    const plantToBuy = lockedPlants.find(p => p.id === plantId);
    
    if (!plantToBuy) return;
    
    if (coins < plantToBuy.cost) {
      setNotification(`Not enough coins! You need ${plantToBuy.cost} coins.`);
      playShakeAnimation();
      return;
    }
    
    // Deduct coins and add plant to garden
    setCoins(coins - plantToBuy.cost);
    setPlants([...plants, { ...plantToBuy }]);
    setLockedPlants(lockedPlants.filter(p => p.id !== plantId));
    
    setMessage(`You purchased a ${plantToBuy.name}!`);
    
    // Play purchase sound
    if (soundEffects.purchase) {
      soundEffects.purchase.replayAsync();
    }
  };

  // Harvest a fully grown plant
  const harvestPlant = (id) => {
    const plantToHarvest = plants.find(p => p.id === id);
    
    if (!plantToHarvest || plantToHarvest.growth < 4) return;
    
    // Award coins based on plant happiness
    const harvestCoins = plantToHarvest.happiness * 5;
    setCoins(coins + harvestCoins);
    
    // Reset the plant
    setPlants(plants.map(plant => {
      if (plant.id === id) {
        return {
          ...plant,
          growth: 0,
          needsWater: true,
          lastWatered: null,
        };
      }
      return plant;
    }));
    
    setMessage(`Harvested ${plantToHarvest.name} for ${harvestCoins} coins!`);
    
    // Play harvest sound
    if (soundEffects.harvest) {
      soundEffects.harvest.replayAsync();
    }
  };

  // Reset garden
  const resetGarden = () => {
    Alert.alert(
      "Reset Garden?",
      "Would you like to start a new garden? You'll lose all progress.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes", 
          onPress: () => {
            // Reset all stats
            setPlants([
              { id: 1, name: 'Rose', growth: 0, needsWater: true, lastWatered: null, 
                growthRate: 1, waterNeed: 1, happiness: 5, description: 'Beautiful and fragrant', unlockedAt: 1 },
              { id: 2, name: 'Tulip', growth: 0, needsWater: true, lastWatered: null,
                growthRate: 1.2, waterNeed: 0.8, happiness: 3, description: 'Cheerful spring flower', unlockedAt: 1 },
              { id: 3, name: 'Sunflower', growth: 0, needsWater: true, lastWatered: null, 
                growthRate: 0.8, waterNeed: 1.5, happiness: 4, description: 'Tall and sunny', unlockedAt: 1 },
            ]);
            
            setLockedPlants([
              { id: 4, name: 'Lavender', growth: 0, needsWater: true, lastWatered: null, 
                growthRate: 0.7, waterNeed: 0.6, happiness: 4, description: 'Aromatic and calming', unlockedAt: 3, cost: 50 },
              { id: 5, name: 'Cactus', growth: 0, needsWater: true, lastWatered: null, 
                growthRate: 0.5, waterNeed: 0.3, happiness: 2, description: 'Drought resistant', unlockedAt: 5, cost: 100 },
              { id: 6, name: 'Orchid', growth: 0, needsWater: true, lastWatered: null, 
                growthRate: 1.5, waterNeed: 1.2, happiness: 7, description: 'Exotic and elegant', unlockedAt: 7, cost: 200 },
            ]);
            
            setDayCount(1);
            setCoins(20);
            setWaterSupply(5);
            setFertilizer(1);
            setGardenLevel(1);
            setGardenHappiness(0);
            setWeather('sunny');
            setMessage('Welcome to your new garden!');
          }
        }
      ]
    );
  };

  // Animation for watering
  const playWaterAnimation = () => {
    wateringAnimation.setValue(0);
    Animated.timing(wateringAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.bounce,
    }).start(() => {
      setTimeout(() => {
        setActiveEffect(null);
      }, 500);
    });
  };

  // Animation for errors (shake)
  const playShakeAnimation = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTimeout(() => {
        setNotification('');
      }, 2000);
    });
  };

  // Check if all plants are fully grown
  useEffect(() => {
    const allFullyGrown = plants.every(plant => plant.growth === 4);
    if (allFullyGrown && plants.length >= 3) {
      setMessage('Congratulations! All your plants are in full bloom!');
    }
    
    // Update garden happiness whenever plants change
    updateGardenHappiness();
  }, [plants]);

  // Clear notifications after a delay
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Get plant emoji based on plant type and growth stage
  const getPlantEmoji = (plant) => {
    const emojiSet = plantEmojis[plant.name] || growthStages;
    return emojiSet[Math.floor(plant.growth)];
  };

  // Store section component
  const StoreModal = () => (
    <Modal
      visible={showStore}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStore(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Garden Store</Text>
          
          <ScrollView style={styles.storeItemsList}>
            {/* Plants section */}
            <Text style={styles.storeSection}>Plants</Text>
            {lockedPlants.filter(plant => plant.unlockedAt <= gardenLevel).map(plant => (
              <TouchableOpacity
                key={plant.id}
                style={styles.storeItem}
                onPress={() => purchasePlant(plant.id)}
              >
                <Text style={styles.storeItemEmoji}>{plantEmojis[plant.name][4]}</Text>
                <View style={styles.storeItemInfo}>
                  <Text style={styles.storeItemName}>{plant.name}</Text>
                  <Text style={styles.storeItemDesc}>{plant.description}</Text>
                </View>
                <Text style={styles.storeItemPrice}>{plant.cost} 🪙</Text>
              </TouchableOpacity>
            ))}
            
            {/* Supplies section */}
            <Text style={styles.storeSection}>Supplies</Text>
            <TouchableOpacity
              style={styles.storeItem}
              onPress={() => {
                if (coins >= 10) {
                  setCoins(coins - 10);
                  setWaterSupply(prev => Math.min(prev + 5, 15));
                  setNotification("Purchased 5 water!");
                } else {
                  setNotification("Not enough coins!");
                  playShakeAnimation();
                }
              }}
            >
              <Text style={styles.storeItemEmoji}>💧</Text>
              <View style={styles.storeItemInfo}>
                <Text style={styles.storeItemName}>Water Refill</Text>
                <Text style={styles.storeItemDesc}>+5 water supply</Text>
              </View>
              <Text style={styles.storeItemPrice}>10 🪙</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.storeItem}
              onPress={() => {
                if (coins >= 25) {
                  setCoins(coins - 25);
                  setFertilizer(prev => prev + 1);
                  setNotification("Purchased fertilizer!");
                } else {
                  setNotification("Not enough coins!");
                  playShakeAnimation();
                }
              }}
            >
              <Text style={styles.storeItemEmoji}>🧪</Text>
              <View style={styles.storeItemInfo}>
                <Text style={styles.storeItemName}>Fertilizer</Text>
                <Text style={styles.storeItemDesc}>Instant growth boost</Text>
              </View>
              <Text style={styles.storeItemPrice}>25 🪙</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStore(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Statistics modal component
  const StatsModal = () => (
    <Modal
      visible={showStats}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStats(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Garden Statistics</Text>
          
          <ScrollView style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Garden Level:</Text>
              <Text style={styles.statValue}>{gardenLevel}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Days Tended:</Text>
              <Text style={styles.statValue}>{dayCount}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Garden Happiness:</Text>
              <Text style={styles.statValue}>{gardenHappiness} ❤️</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Plants Owned:</Text>
              <Text style={styles.statValue}>{plants.length}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fully Grown Plants:</Text>
              <Text style={styles.statValue}>{plants.filter(p => p.growth >= 4).length}</Text>
            </View>
            
            <Text style={[styles.modalTitle, {marginTop: 20, fontSize: 24}]}>Achievements</Text>
            
            <View style={[
              styles.achievement, 
              gardenLevel >= 3 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Text style={styles.achievementName}>Budding Gardener</Text>
              <Text style={styles.achievementDesc}>Reach garden level 3</Text>
            </View>
            
            <View style={[
              styles.achievement, 
              plants.length >= 5 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Text style={styles.achievementName}>Plant Collector</Text>
              <Text style={styles.achievementDesc}>Have 5 different plants</Text>
            </View>
            
            <View style={[
              styles.achievement, 
              dayCount >= 10 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Text style={styles.achievementName}>Dedicated Gardener</Text>
              <Text style={styles.achievementDesc}>Tend your garden for 10 days</Text>
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStats(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StoreModal />
      <StatsModal />
      
      {/* Header area */}
      <View style={styles.header}>
        <Text style={styles.title}>My Gentle Garden</Text>
        
        <View style={styles.resourcesContainer}>
          <View style={styles.resource}>
            <Text style={styles.resourceIcon}>🪙</Text>
            <Text style={styles.resourceValue}>{coins}</Text>
          </View>
          
          <View style={styles.resource}>
            <Text style={styles.resourceIcon}>💧</Text>
            <Text style={styles.resourceValue}>{waterSupply}</Text>
          </View>
          
          <View style={styles.resource}>
            <Text style={styles.resourceIcon}>🧪</Text>
            <Text style={styles.resourceValue}>{fertilizer}</Text>
          </View>
        </View>
      </View>
      
      {/* Day and weather info */}
      <View style={styles.infoContainer}>
        <View style={styles.dayContainer}>
          <Text style={styles.dayText}>Day {dayCount}</Text>
          <Text style={styles.levelText}>Level {gardenLevel}</Text>
        </View>
        
        <View style={styles.weatherContainer}>
          <Text style={styles.weatherIcon}>{weatherTypes[weather].icon}</Text>
          <Text style={styles.weatherText}>{weather}</Text>
        </View>
      </View>
      
      {/* Message area */}
      <Animated.View 
        style={[
          styles.messageContainer,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        <Text style={styles.messageText}>{message}</Text>
        {notification ? (
          <Text style={styles.notificationText}>{notification}</Text>
        ) : null}
      </Animated.View>
      
      {/* Garden area */}
      <ScrollView style={styles.gardenScrollView}>
        <View style={styles.gardenContainer}>
          {plants.map((plant) => (
            <TouchableOpacity
              key={plant.id}
              style={[
                styles.plantContainer,
                plant.needsWater ? styles.needsWater : 
                plant.growth >= 4 ? styles.fullBloom : styles.watered,
                activeEffect?.plantId === plant.id ? styles.activeEffect : null
              ]}
              onLongPress={() => plant.growth >= 4 ? harvestPlant(plant.id) : null}
              onPress={() => plant.needsWater ? waterPlant(plant.id) : applyFertilizer(plant.id)}
            >
              <Text style={styles.plantEmoji}>
                {getPlantEmoji(plant)}
              </Text>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.plantStatus}>
                {plant.needsWater ? 'Needs Water 💧' : 
                 plant.growth >= 4 ? 'Ready to Harvest!' : `Growing (${Math.floor(plant.growth * 25)}%)`}
              </Text>
              
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.floor(plant.growth * 25)}%` }
                  ]} 
                />
              </View>
              
              {/* Plant action hint */}
              <Text style={styles.plantHint}>
                {plant.needsWater ? 'Tap to water' : 
                 plant.growth >= 4 ? 'Hold to harvest' : 'Tap to fertilize'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {/* Button area */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.storeButton]}
          onPress={() => setShowStore(true)}
        >
          <Text style={styles.buttonText}>Store</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={advanceDay}
        >
          <Text style={styles.buttonText}>Next Day</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.statsButton]}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.buttonText}>Stats</Text>
        </TouchableOpacity>
      </View>
      
      {/* Reset button */}
      <TouchableOpacity
        style={[styles.button, styles.resetButton]}
        onPress={resetGarden}
      >
        <Text style={styles.buttonText}>New Garden</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#E8F5E9',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E7D32',
    marginVertical: 10,
  },
  resourcesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#C8E6C9',
    borderRadius: 15,
    padding: 10,
    width: '100%',
  },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  resourceIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  resourceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  levelText: {
    fontSize: 16,
    color: '#388E3C',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 24,
    marginRight: 5,
  },
  weatherText: {
    fontSize: 16,
    color: '#1B5E20',
    textTransform: 'capitalize',
  },
  messageContainer: {
    backgroundColor: '#C8E6C9',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    color: '#1B5E20',
    textAlign: 'center',
  },
  notificationText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
  },
  gardenScrollView: {
    flex: 1,
  },
  gardenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  plantContainer: {
    width: width * 0.44,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  needsWater: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  watered: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  fullBloom: {
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  activeEffect: {
    backgroundColor: '#E3F2FD',
  },
  plantEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1B5E20',
  },
  plantStatus: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 5,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#ECEFF1',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  plantHint: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  storeButton: {
    backgroundColor: '#2196F3',
  },
  statsButton: {
    backgroundColor: '#FF9800',
  },
  resetButton: {
    backgroundColor: '#9E9E9E',
    marginHorizontal: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E7D32',
    marginBottom: 15,
  },
  storeItemsList: {
    maxHeight: 400,
  },
  storeSection: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 10,
    marginBottom: 5,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  storeItemEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  storeItemInfo: {
    flex: 1,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  storeItemDesc: {
    fontSize: 14,
    color: '#757575',
  },
  storeItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    maxHeight: 400,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  achievement: {
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  achievementUnlocked: {
    backgroundColor: '#C8E6C9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  achievementLocked: {
    backgroundColor: '#ECEFF1',
    borderLeftWidth: 4,
    borderLeftColor: '#BDBDBD',
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#757575',
  }
});

export default GentleGardenGame;