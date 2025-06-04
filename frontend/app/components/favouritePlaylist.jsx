// FavoritePlaylist.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';
import { useTheme } from './ThemeContext'; // Import the theme hook

const { width, height } = Dimensions.get('window');

// Import all cover images statically
const COVER_IMAGES = {
  'The Beatles': require('../../assets/images/The Beatles - Hey Jude.jpg'),
  'Ilayaraja': require('../../assets/images/Ilayaraja.jpg'),
  'Queen': require('../../assets/images/The Beatles - Hey Jude.jpg'),
  'SPB': require('../../assets/images/SPB.jpeg'),
  'Janaki': require('../../assets/images/Janaki.jpeg'),
  'Hariharan': require('../../assets/images/Hariharan.jpg'),
  'Melody': require('../../assets/images/Melody.jpg'),
  'Yesudas': require('../../assets/images/Yesudas.jpg'),
};

// Fallback cover image
const DEFAULT_COVER = require('../../assets/images/The Beatles - Hey Jude.jpg');

const FavoritePlaylist = ({ route, navigation }) => {
  const { currentUser, token, getAuthHeader } = useAuth();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [songAssets, setSongAssets] = useState({});
  
  // Theme
  const { theme } = useTheme();
  
  // Refs
  const playbackPositionTimer = useRef(null);
  const isUnmounted = useRef(false);

  // Get static cover image
  const getStaticCoverImage = (artist, album) => {
    const albumKey = `${artist} - ${album}`;
    if (album && COVER_IMAGES[albumKey]) {
      return COVER_IMAGES[albumKey];
    }
    
    if (COVER_IMAGES[artist]) {
      return COVER_IMAGES[artist];
    }
    
    return DEFAULT_COVER;
  };

  // Setup audio
  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  };

  // Cleanup audio
  const cleanupAudio = async () => {
    if (playbackPositionTimer.current) {
      clearInterval(playbackPositionTimer.current);
      playbackPositionTimer.current = null;
    }
    
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.warn('Error cleaning up sound:', error);
      }
      setSound(null);
    }
  };

  // Load asset info for local files
  const loadAssetInfo = async (fileName) => {
    try {
      const possiblePaths = [
        `${FileSystem.documentDirectory}assets/songs/${fileName}`,
        `${FileSystem.cacheDirectory}assets/songs/${fileName}`,
        `${FileSystem.bundleDirectory}/assets/songs/${fileName}`,
      ];
      
      for (const path of possiblePaths) {
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          return { 
            uri: path,
            exists: true,
            type: 'fs'
          };
        }
      }
      
      const assetMapping = {
        'The Beatles - Hey Jude.mp3': require('../../assets/songs/The Beatles - Hey Jude.mp3'),
        'Ilayaraja - Kadhal kasakkuthaiya.mp3': require('../../assets/songs/Ilayaraja - Kadhal kasakkuthaiya.mp3'),
        'Ilayaraja - Kannupada Poguthaiya.mp3': require('../../assets/songs/Ilayaraja - Kannupada Poguthaiya.mp3'),
        'Ilayaraja - Sorkkame Endralum.mp3': require('../../assets/songs/Ilayaraja - Sorkkame Endralum.mp3'),
        'Ilayaraja - Thendral Vanthu Theendum Pothu.mp3': require('../../assets/songs/Ilayaraja - Thendral Vanthu Theendum Pothu.mp3'),
        'Ilayaraja - Thulli Ezhunthathu Pattu.mp3': require('../../assets/songs/Ilayaraja - Thulli Ezhunthathu Pattu.mp3'),
        'Ilayaraja - Indha Maan.mp3': require('../../assets/songs/Ilayaraja - Indha Maan.mp3'),
        'Ilayaraja - Janani Janani.mp3': require('../../assets/songs/Ilayaraja - Janani Janani.mp3'),
        'Ilayaraja - Nila Athu Vaanathumel.mp3': require('../../assets/songs/Ilayaraja - Nila Athu Vaanathumel.mp3'),
        'Ilayaraja - Thenpandi Cheemayile.mp3': require('../../assets/songs/Ilayaraja - Thenpandi Cheemayile.mp3'),
        'Ilayaraja - Kalyanamalai.mp3': require('../../assets/songs/Ilayaraja - Kalyanamalai.mp3'),
        'SPB - Chinnamani Kuyile.mp3': require('../../assets/songs/SPB - Chinnamani Kuyile.mp3'),
        'SPB - Mannil Indha Kaadhal.mp3': require('../../assets/songs/SPB - Mannil Indha Kaadhal.mp3'),
        'SPB - Nilave Mugam Kaatu.mp3': require('../../assets/songs/SPB - Nilave Mugam Kaatu.mp3'),
        'SPB - Thenmadurai Vaigai Nadhi.mp3': require('../../assets/songs/SPB - Thenmadurai Vaigai Nadhi.mp3'),
        'SPB - Valaiyosai.mp3': require('../../assets/songs/SPB - Valaiyosai.mp3'),
        'SPB - Anjali Anjali.mp3': require('../../assets/songs/SPB - Anjali Anjali.mp3'),
        'SPB - Yaaro.mp3': require('../../assets/songs/SPB - Yaaro.mp3'),
        'SPB - Nenjukkule Innarendru.mp3': require('../../assets/songs/SPB - Nenjukkule Innarendru.mp3'),
        'SPB - Mun Paniya.mp3': require('../../assets/songs/SPB - Mun Paniya.mp3'),
        'SPB - Velli Malare.mp3': require('../../assets/songs/SPB - Velli Malare.mp3'),
        'Janaki - Chinna Chinna.mp3': require('../../assets/songs/Janaki - Chinna Chinna.mp3'),
        'Janaki - Endhan Nenjil.mp3': require('../../assets/songs/Janaki - Endhan Nenjil.mp3'),
        'Janaki - Entha Poovilum Vaasam.mp3': require('../../assets/songs/Janaki - Entha Poovilum Vaasam.mp3'),
        'Janaki - Kaadhal Kaditham.mp3': require('../../assets/songs/Janaki - Kaadhal Kaditham.mp3'),
        'Janaki - Kaatril Enthan Geetham.mp3': require('../../assets/songs/Janaki - Kaatril Enthan Geetham.mp3'),
        'Janaki - Ooru Sanam.mp3': require('../../assets/songs/Janaki - Ooru Sanam.mp3'),
        'Janaki - Rasave Unna Nambi.mp3': require('../../assets/songs/Janaki - Rasave Unna Nambi.mp3'),
        'Janaki - Santhana Kaatre.mp3': require('../../assets/songs/Janaki - Santhana Kaatre.mp3'),
        'Janaki - Senthoora Poove.mp3': require('../../assets/songs/Janaki - Senthoora Poove.mp3'),
        'Janaki - Thendral Vanthu Ennai.mp3': require('../../assets/songs/Janaki - Thendral Vanthu Ennai.mp3'),
        'Hariharan - Anbae Anbae.mp3': require('../../assets/songs/Hariharan - Anbae Anbae.mp3'),
        'Hariharan - Chandiranai Thottathu.mp3': require('../../assets/songs/Hariharan - Chandiranai Thottathu.mp3'),
        'Hariharan - Ennai Thalatta.mp3': require('../../assets/songs/Hariharan - Ennai Thalatta.mp3'),
        'Hariharan - Irava Pagala.mp3': require('../../assets/songs/Hariharan - Irava Pagala.mp3'),
        'Hariharan - Irupathu Kodi.mp3': require('../../assets/songs/Hariharan - Irupathu Kodi.mp3'),
        'Hariharan - Kurukku Siruthavaley.mp3': require('../../assets/songs/Hariharan - Kurukku Siruthavaley.mp3'),
        'Hariharan - Minnal Oru Kodi.mp3': require('../../assets/songs/Hariharan - Minnal Oru Kodi.mp3'),
        'Hariharan - Oru Poiyavathu.mp3': require('../../assets/songs/Hariharan - Oru Poiyavathu.mp3'),
        'Hariharan - Pachai Nirame.mp3': require('../../assets/songs/Hariharan - Pachai Nirame.mp3'),
        'Hariharan - Un Per Solla.mp3': require('../../assets/songs/Hariharan - Un Per Solla.mp3'),
        'Melody - Kan Irandil.mp3': require('../../assets/songs/Melody - Kan Irandil.mp3'),
        'Melody - Kannalanae.mp3': require('../../assets/songs/Melody - Kannalanae.mp3'),
        'Melody - Malargal Kaettae.mp3': require('../../assets/songs/Melody - Malargal Kaettae.mp3'),
        'Melody - Melliname.mp3': require('../../assets/songs/Melody - Melliname.mp3'),
        'Melody - Munbe Vaa.mp3': require('../../assets/songs/Melody - Munbe Vaa.mp3'),
        'Melody - Mundhinam.mp3': require('../../assets/songs/Melody - Mundhinam.mp3'),
        'Melody - New York Nagaram.mp3': require('../../assets/songs/Melody - New York Nagaram.mp3'),
        'Melody - Partha Mudhal.mp3': require('../../assets/songs/Melody - Partha Mudhal.mp3'),
        'Melody - Poovukkul.mp3': require('../../assets/songs/Melody - Poovukkul.mp3'),
        'Melody - Vennilave Vennilave.mp3': require('../../assets/songs/Melody - Vennilave Vennilave.mp3'),
        'Yesudas - Agaram Ippo.mp3': require('../../assets/songs/Yesudas - Agaram Ippo.mp3'),
        'Yesudas - Kanne Kalaimane.mp3': require('../../assets/songs/Yesudas - Kanne Kalaimane.mp3'),
        'Yesudas - Mazhai varudhu.mp3': require('../../assets/songs/Yesudas - Mazhai varudhu.mp3'),
        'Yesudas - Oora therinjukitten.mp3': require('../../assets/songs/Yesudas - Oora therinjukitten.mp3'),
        'Yesudas - Pachai Kiligal.mp3': require('../../assets/songs/Yesudas - Pachai Kiligal.mp3'),
        'Yesudas - Poove sempoove.mp3': require('../../assets/songs/Yesudas - Poove sempoove.mp3'),
        'Yesudas - Pottu Vaitha.mp3': require('../../assets/songs/Yesudas - Pottu Vaitha.mp3'),
        'Yesudas - Raja Raja Chozhan.mp3': require('../../assets/songs/Yesudas - Raja Raja Chozhan.mp3'),
        'Yesudas - Senthazham Poovil.mp3': require('../../assets/songs/Yesudas - Senthazham Poovil.mp3'),
        'Yesudas - Un Paarvayil.mp3': require('../../assets/songs/Yesudas - Un Paarvayil.mp3'),
      };
      
      if (assetMapping[fileName]) {
        const asset = Asset.fromModule(assetMapping[fileName]);
        await asset.downloadAsync();
        return {
          uri: asset.uri,
          exists: true,
          type: 'asset'
        };
      }
      
      return { exists: false };
    } catch (err) {
      console.warn(`Error checking asset ${fileName}:`, err);
      return { exists: false };
    }
  };

  // Cache song asset info
  const cacheSongAssetInfo = async (songs) => {
    const assets = {};
    
    for (const song of songs) {
      if (song.isLocalAudio) {
        try {
          const assetInfo = await loadAssetInfo(song.localAudioFileName);
          assets[song.localAudioFileName] = assetInfo;
        } catch (err) {
          console.warn(`Could not load asset info for ${song.localAudioFileName}:`, err);
        }
      }
    }
    
    setSongAssets(assets);
  };

  // Update playback status
  const updatePlaybackStatus = async () => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);
        setPosition(status.positionMillis / 1000);
        setDuration(status.durationMillis / 1000 || currentSong?.duration || 0);
      }
    } catch (error) {
      console.warn('Error getting playback status:', error);
    }
  };

  // Start position timer
  const startPositionTimer = () => {
    if (playbackPositionTimer.current) {
      clearInterval(playbackPositionTimer.current);
    }
    
    playbackPositionTimer.current = setInterval(async () => {
      if (sound && !isSeeking && !isUnmounted.current) {
        await updatePlaybackStatus();
      }
    }, 1000);
  };

  // Play song handler
  const playSong = async (song) => {
    if (isUnmounted.current) return;
    
    try {
      setIsLoading(true);
      
      // Unload previous sound if exists
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      
      // Clear previous timer
      if (playbackPositionTimer.current) {
        clearInterval(playbackPositionTimer.current);
      }
      
      setCurrentSong(song);
      setPosition(0);
      setDuration(song.duration);
      
      // Handle audio source
      let audioSource;
      
      if (song.isLocalAudio) {
        if (songAssets[song.localAudioFileName]?.exists) {
          audioSource = { uri: songAssets[song.localAudioFileName].uri };
        } else {
          const assetInfo = await loadAssetInfo(song.localAudioFileName);
          if (assetInfo.exists) {
            audioSource = { uri: assetInfo.uri };
          } else {
            audioSource = { uri: song.audioUrl };
          }
        }
      } else {
        audioSource = { uri: song.audioUrl };
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
      startPositionTimer();
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Playback Error', `Failed to play "${song.title}"`);
    } finally {
      setIsLoading(false);
    }
  };

  // Playback status update
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (!isSeeking) {
        setPosition(status.positionMillis / 1000);
        setDuration(status.durationMillis / 1000 || currentSong?.duration || 0);
      }
      
      if (status.didJustFinish) {
        playNextSong();
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
        startPositionTimer();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Playback toggle error:', error);
    }
  };

  // Seek to position
  const seekToPosition = async (value) => {
    if (!sound) return;
    
    try {
      const newPosition = value * 1000;
      await sound.setPositionAsync(newPosition);
      setPosition(value);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  // Handle seeking
  const handleStartSeeking = () => {
    setIsSeeking(true);
    if (playbackPositionTimer.current) {
      clearInterval(playbackPositionTimer.current);
    }
  };

  const handleStopSeeking = (value) => {
    seekToPosition(value);
    setIsSeeking(false);
    startPositionTimer();
  };

  // Play next song
  const playNextSong = () => {
    if (!currentSong || favoriteSongs.length === 0) return;
    
    const currentIndex = favoriteSongs.findIndex(song => song._id === currentSong._id);
    const nextIndex = (currentIndex + 1) % favoriteSongs.length;
    playSong(favoriteSongs[nextIndex]);
  };

  // Play previous song
  const playPreviousSong = () => {
    if (!currentSong || favoriteSongs.length === 0) return;
    
    const currentIndex = favoriteSongs.findIndex(song => song._id === currentSong._id);
    const previousIndex = (currentIndex - 1 + favoriteSongs.length) % favoriteSongs.length;
    playSong(favoriteSongs[previousIndex]);
  };

  // Toggle expanded player
  const toggleExpandedPlayer = () => {
    setExpanded(!expanded);
  };

  // Format time
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fetch favorite songs
  const fetchFavoriteSongs = async () => {
    if (!currentUser || !token) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://final-year-project-5wgk.onrender.com/api/favorites?userId=${currentUser.userId}`,
        { headers: getAuthHeader() }
      );
      
      const songsWithCovers = response.data.map(song => ({
        ...song,
        albumCover: getStaticCoverImage(song.artist, song.album),
        isLocalAudio: song.isLocalAudio || false,
        localAudioFileName: song.localAudioFileName || ''
      }));
      
      setFavoriteSongs(songsWithCovers);
      await cacheSongAssetInfo(songsWithCovers);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorite songs');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (songId, event) => {
    if (event) event.stopPropagation();
    
    if (!currentUser || !token) {
      Alert.alert('Login Required', 'Please login to manage favorites');
      return;
    }
    
    try {
      await axios.delete(`https://final-year-project-5wgk.onrender.com/api/favorites/${songId}`, {
        headers: getAuthHeader(),
        data: { userId: currentUser.userId }
      });
      
      setFavoriteSongs(prev => prev.filter(song => song._id !== songId));
      
      // If the removed song is currently playing, stop playback
      if (currentSong && currentSong._id === songId) {
        await cleanupAudio();
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  // Initialize and cleanup
  useEffect(() => {
    isUnmounted.current = false;
    
    const initialize = async () => {
      await setupAudio();
      await fetchFavoriteSongs();
    };
    
    initialize();
    
    // App state listener for background behavior
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        if (sound && isPlaying) {
          sound.pauseAsync();
          setIsPlaying(false);
        }
      }
    });
    
    return () => {
      isUnmounted.current = true;
      subscription.remove();
      (async () => {
        await cleanupAudio();
      })();
    };
  }, []);

  // Render song item
  const renderSongItem = ({ item }) => {
    const isActive = currentSong && currentSong._id === item._id;
    
    return (
      <TouchableOpacity
        key={item._id}
        style={[
          styles(theme).songItem,
          isActive && styles(theme).activeSong
        ]}
        onPress={() => playSong(item)}
      >
        <Image
          source={item.albumCover}
          style={styles(theme).albumCover}
          defaultSource={DEFAULT_COVER}
        />
        <View style={styles(theme).songInfo}>
          <Text style={[styles(theme).songTitle, isActive && styles(theme).activeText]}>{item.title}</Text>
          <Text style={styles(theme).songArtist}>{item.artist}</Text>
        </View>
        <View style={styles(theme).actions}>
          {isActive && (
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color="#4285F4" 
              style={styles(theme).playIcon}
            />
          )}
          <TouchableOpacity 
            onPress={(e) => toggleFavorite(item._id, e)}
          >
            <Ionicons 
              name="heart" 
              size={24} 
              color="#FF0000" 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render expanded player
  const renderExpandedPlayer = () => {
    if (!currentSong) return null;

    return (
      <View style={styles(theme).expandedPlayerContainer}>
        <TouchableOpacity 
          style={styles(theme).expandedPlayerCloseBtn}
          onPress={toggleExpandedPlayer}
        >
          <Ionicons name="chevron-down" size={28} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles(theme).expandedPlayerContent}>
          <Image 
            source={currentSong.albumCover}
            style={styles(theme).expandedCover}
            defaultSource={DEFAULT_COVER}
          />
          
          <View style={styles(theme).expandedSongInfo}>
            <Text style={styles(theme).expandedTitle}>{currentSong.title}</Text>
            <Text style={styles(theme).expandedArtist}>{currentSong.artist}</Text>
            <TouchableOpacity 
              onPress={(e) => toggleFavorite(currentSong._id, e)}
              style={styles(theme).expandedFavoriteButton}
            >
              <Ionicons 
                name="heart" 
                size={28} 
                color="#FF0000" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles(theme).progressContainer}>
            <Slider
              style={styles(theme).progressBar}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingStart={handleStartSeeking}
              onSlidingComplete={handleStopSeeking}
              minimumTrackTintColor="#4285f4"
              maximumTrackTintColor="#555"
              thumbTintColor="#4285f4"
            />
            <View style={styles(theme).timeContainer}>
              <Text style={styles(theme).timeText}>{formatTime(position)}</Text>
              <Text style={styles(theme).timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          <View style={styles(theme).expandedControls}>
            <TouchableOpacity 
              style={styles(theme).expandedControlBtn}
              onPress={playPreviousSong}
            >
              <Ionicons name="play-skip-back" size={32} color={theme.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles(theme).expandedPlayButton}
              onPress={togglePlayPause}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.text} />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="white" 
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles(theme).expandedControlBtn}
              onPress={playNextSong}
            >
              <Ionicons name="play-skip-forward" size={32} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles(theme).loadingText}>Loading your favorites...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles(theme).container}>  
      {/* Expanded Player */}
      {expanded && renderExpandedPlayer()}
      
      {/* Main Content Area */}
      {!expanded && (
        <View style={styles(theme).listContainer}>
          <View style={styles(theme).header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles(theme).backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles(theme).headerTitle}>Favorite Songs</Text>
            <TouchableOpacity onPress={fetchFavoriteSongs} style={styles(theme).refreshButton}>
              <Ionicons name="refresh" size={24} color="#4285F4" />
            </TouchableOpacity>
          </View>

          {favoriteSongs.length === 0 ? (
            <View style={styles(theme).emptyContainer}>
              <Ionicons name="heart-dislike" size={48} color={theme.subText} />
              <Text style={styles(theme).emptyText}>No favorite songs yet</Text>
              <Text style={styles(theme).emptySubText}>Tap the heart icon on songs to add them here</Text>
            </View>
          ) : (
            <FlatList
              data={favoriteSongs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles(theme).songList}
            />
          )}
        </View>
      )}
      
      {/* Player Controls */}
      {!expanded && currentSong && (
        <View style={styles(theme).playerBar}>
          <TouchableOpacity 
            style={styles(theme).playerContent}
            onPress={toggleExpandedPlayer}
          >
            <Image 
              source={currentSong.albumCover}
              style={styles(theme).miniCover}
              defaultSource={DEFAULT_COVER}
            />
            
            <View style={styles(theme).songDetails}>
              <Text style={styles(theme).playerTitle}>{currentSong.title}</Text>
              <Text style={styles(theme).playerArtist}>{currentSong.artist}</Text>
            </View>
            
            <View style={styles(theme).controls}>
              <TouchableOpacity onPress={playPreviousSong} style={styles(theme).controlButton}>
                <Ionicons name="play-skip-back" size={24} color={theme.text} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles(theme).playButton} onPress={togglePlayPause}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color={'white'} 
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={playNextSong} style={styles(theme).controlButton}>
                <Ionicons name="play-skip-forward" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          
          <View style={styles(theme).miniProgressContainer}>
            <View 
              style={[
                styles(theme).miniProgress, 
                { width: `${(position / (duration || 1)) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  
  loadingText: {
    color: theme.text,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  
  // List Container
  listContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    
    borderBottomColor: theme.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.cardBackground,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.cardBackground,
  },
  
  // Song List Styles
  songList: {
    paddingBottom: 120, // Extra space for player bar
  },
  
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    
  },
  
  activeSong: {
    backgroundColor: theme.activeBackground,
    borderWidth: 1,
    borderColor: '#4285f4',
  },
  
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  
  activeText: {
    color: '#4285f4',
  },
  
  songArtist: {
    fontSize: 14,
    color: theme.subText,
    marginBottom: 2,
  },
  
  songDuration: {
    fontSize: 12,
    color: theme.subText,
  },
  
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  playIcon: {
    marginRight: 4,
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptySubText: {
    fontSize: 14,
    color: theme.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Player Bar Styles
  playerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
    
    
  },
  
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  miniCover: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  
  songDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  
  playerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  
  playerArtist: {
    fontSize: 12,
    color: theme.subText,
  },
  
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  controlButton: {
    padding: 6,
  },
  
  playButton: {
    padding: 8,
    backgroundColor: '#4285f4',
    borderRadius: 25,
  },
  
  miniProgressContainer: {
    height: 6,
    backgroundColor: theme.border,
  },
  
  miniProgress: {
    height: '100%',
    backgroundColor: '#4285f4',
  },
  
  // Expanded Player Styles
  expandedPlayerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.background,
    zIndex: 1000,
  },
  
  expandedPlayerCloseBtn: {
    alignSelf: 'left',
    padding: 16,
    marginTop: 8,
  },
  
  expandedPlayerContent: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  
  expandedCover: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    marginTop: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  expandedSongInfo: {
    alignItems: 'center',
   marginTop:-30,
  },
  
  expandedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  expandedArtist: {
    fontSize: 18,
    color: theme.subText,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  expandedFavoriteButton: {
    padding: 12,
    alignSelf:'center',
    marginLeft:300,
    borderRadius: 30,
    marginBottom:-20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  // Progress Bar Styles
  progressContainer: {
    width: '100%',
    marginTop:-50,
  },
  
  progressBar: {
    width: '100%',
    height: 40,
  },
  
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  
  timeText: {
    fontSize: 14,
    color: theme.subText,
    fontWeight: '500',
  },
  
  // Expanded Controls
  expandedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
   marginBottom:60,
  },
  
  expandedControlBtn: {
    padding: 16,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  expandedPlayButton: {
    width: 70,
    height: 70,
    backgroundColor: '#4285F4',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default FavoritePlaylist