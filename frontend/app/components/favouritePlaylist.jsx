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

const { width } = Dimensions.get('window');

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
        `http://192.168.227.81:1234/api/favorites?userId=${currentUser.userId}`,
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
      await axios.delete(`http://192.168.227.81:1234/api/favorites/${songId}`, {
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
          styles.songItem,
          isActive && styles.activeSong
        ]}
        onPress={() => playSong(item)}
      >
        <Image
          source={item.albumCover}
          style={styles.albumCover}
          defaultSource={DEFAULT_COVER}
        />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isActive && styles.activeText]}>{item.title}</Text>
          <Text style={styles.songArtist}>{item.artist}</Text>
          <Text style={styles.songDuration}>{formatTime(item.duration)}</Text>
        </View>
        <View style={styles.actions}>
          {isActive && (
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color="#1DB954" 
              style={styles.playIcon}
            />
          )}
          <TouchableOpacity 
            onPress={(e) => toggleFavorite(item._id, e)}
          >
            <Ionicons 
              name="heart" 
              size={24} 
              color="#1DB954" 
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
      <View style={styles.expandedPlayerContainer}>
        <TouchableOpacity 
          style={styles.expandedPlayerCloseBtn}
          onPress={toggleExpandedPlayer}
        >
          <Ionicons name="chevron-down" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.expandedPlayerContent}>
          <Image 
            source={currentSong.albumCover}
            style={styles.expandedCover}
            defaultSource={DEFAULT_COVER}
          />
          
          <View style={styles.expandedSongInfo}>
            <Text style={styles.expandedTitle}>{currentSong.title}</Text>
            <Text style={styles.expandedArtist}>{currentSong.artist}</Text>
            <TouchableOpacity 
              onPress={(e) => toggleFavorite(currentSong._id, e)}
              style={styles.expandedFavoriteButton}
            >
              <Ionicons 
                name="heart" 
                size={28} 
                color="#1DB954" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingStart={handleStartSeeking}
              onSlidingComplete={handleStopSeeking}
              minimumTrackTintColor="#1DB954"
              maximumTrackTintColor="#555"
              thumbTintColor="#1DB954"
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          <View style={styles.expandedControls}>
            <TouchableOpacity 
              style={styles.expandedControlBtn}
              onPress={playPreviousSong}
            >
              <Ionicons name="play-skip-back" size={32} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.expandedPlayButton}
              onPress={togglePlayPause}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="black" 
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.expandedControlBtn}
              onPress={playNextSong}
            >
              <Ionicons name="play-skip-forward" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>  
      {/* Expanded Player */}
      {expanded && renderExpandedPlayer()}
      
      {/* Main Content Area */}
      {!expanded && (
        <View style={styles.listContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Favorite Songs</Text>
            <TouchableOpacity onPress={fetchFavoriteSongs} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color="#1DB954" />
            </TouchableOpacity>
          </View>

          {favoriteSongs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike" size={48} color="#555" />
              <Text style={styles.emptyText}>No favorite songs yet</Text>
              <Text style={styles.emptySubText}>Tap the heart icon on songs to add them here</Text>
            </View>
          ) : (
            <FlatList
              data={favoriteSongs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.songList}
            />
          )}
        </View>
      )}
      
      {/* Player Controls */}
      {!expanded && currentSong && (
        <View style={styles.playerBar}>
          <TouchableOpacity 
            style={styles.playerContent}
            onPress={toggleExpandedPlayer}
          >
            <Image 
              source={currentSong.albumCover}
              style={styles.miniCover}
              defaultSource={DEFAULT_COVER}
            />
            
            <View style={styles.songDetails}>
              <Text style={styles.playerTitle}>{currentSong.title}</Text>
              <Text style={styles.playerArtist}>{currentSong.artist}</Text>
            </View>
            
            <View style={styles.controls}>
              <TouchableOpacity onPress={playPreviousSong} style={styles.controlButton}>
                <Ionicons name="play-skip-back" size={28} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={28} 
                    color="white" 
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={playNextSong} style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          
          <View style={styles.miniProgressContainer}>
            <View 
              style={[
                styles.miniProgress, 
                { width: `${(position / (duration || 1)) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  listContainer: {
    flex: 1,
    paddingBottom: 70, // Space for player bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#b3b3b3',
    marginTop: 15,
    fontSize: 16,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubText: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 30,
  },
  
  // Song list
  songList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  activeSong: {
    backgroundColor: '#282828',
  },
  albumCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 15,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  activeText: {
    color: '#1DB954',
  },
  songArtist: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 2,
  },
  songDuration: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playIcon: {
    marginRight: 15,
  },
  
  // Mini Player
  playerBar: {
    height: 64,
    backgroundColor: '#282828',
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    height: '100%',
  },
  miniCover: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  songDetails: {
    flex: 1,
    marginLeft: 15,
  },
  playerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  playerArtist: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    padding: 8,
  },
  miniProgressContainer: {
    height: 2,
    backgroundColor: '#555',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  miniProgress: {
    height: 2,
    backgroundColor: '#1DB954',
  },
  
  // Expanded Player
  expandedPlayerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 30,
  },
  expandedPlayerCloseBtn: {
    padding: 15,
    alignSelf: 'flex-start',
  },
  expandedPlayerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  expandedCover: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 30,
  },
  expandedSongInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  expandedTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  expandedArtist: {
    color: '#b3b3b3',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  expandedFavoriteButton: {
    padding: 10,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  expandedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  expandedControlBtn: {
    padding: 20,
  },
  expandedPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
  },
});

export default FavoritePlaylist;