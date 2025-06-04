import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Alert, ScrollView, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import Slider from '@react-native-community/slider';
import { useAuth } from './AuthContext';
import { AppState } from 'react-native';
import { useTheme } from './ThemeContext';

// Import placeholder image statically
const PLACEHOLDER_IMAGE = require('../../assets/images/The Beatles - Hey Jude.jpg');

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

const { width } = Dimensions.get('window');

const ArtistMusicPlayer = () => {
  const { currentUser, token, getAuthHeader } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  // State
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [sound, setSound] = useState(null);
  const [songAssets, setSongAssets] = useState({});
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  
  // Refs
  const playbackPositionTimer = useRef(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
  
    const setup = async () => {
      await setupAudio();
      await fetchSongs();
    };
  
    setup();
  
    return () => {
      isUnmounted.current = true;
      (async () => {
        try {
          await cleanupAudio();
        } catch (e) {
          console.warn('Error during component unmount cleanup:', e);
        }
      })();
    };
  }, []);

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
      setIsPlaying(false);
      setCurrentSong(null);
      setPosition(0);
    }
  };

  useEffect(() => {
    if (songs.length > 0) {
      const artistMap = {};
      songs.forEach(song => {
        if (!artistMap[song.artist]) {
          const coverImage = getStaticCoverImage(song.artist);
          artistMap[song.artist] = {
            name: song.artist,
            songs: [],
            coverImage: coverImage
          };
        }
        
        const songWithStaticCover = {
          ...song,
          coverImage: getStaticCoverImage(song.artist, song.album)
        };
        
        artistMap[song.artist].songs.push(songWithStaticCover);
      });
      
      const artistsArray = Object.values(artistMap);
      setArtists(artistsArray);
    }
  }, [songs]);

  useEffect(() => {
    if (currentUser && token) {
      fetchFavorites();
    }
  }, [currentUser, token]);

  const fetchFavorites = async () => {
    try {
      setIsLoadingFavorites(true);
      const response = await axios.get(`https://final-year-project-5wgk.onrender.com/api/favorites?userId=${currentUser.userId}`, {
        headers: getAuthHeader()
      });
      
      const favoritesSet = new Set(response.data.map(song => song._id || song.id));
      setFavorites(favoritesSet);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' && !isPremiumUser) {
        if (sound && isPlaying) {
          sound.pauseAsync();
          setIsPlaying(false);
        }
      }
    });
  
    return () => {
      subscription.remove();
    };
  }, [sound, isPlaying]);

  const stopPlayback = async () => {
    if (!sound) return;
    
    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setPosition(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('Stop playback error:', error);
    }
  };

  const toggleFavorite = async (songId, event) => {
    if (!currentUser || !token) {
      Alert.alert('Login Required', 'Please login to add songs to favorites');
      return;
    }
    
    event.stopPropagation();
    
    try {
      if (favorites.has(songId)) {
        await axios.delete(`https://final-year-project-5wgk.onrender.com/api/favorites/${songId}`, {
          headers: getAuthHeader(),
          data: { userId: currentUser.userId }
        });
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(songId);
          return newFavorites;
        });
      } else {
        await axios.post(`https://final-year-project-5wgk.onrender.com/api/favorites/${songId}`, {
          userId: currentUser.userId
        }, {
          headers: getAuthHeader()
        });
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.add(songId);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  };

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

  const fetchSongs = async () => {
    try {
      setIsLoadingSongs(true);
      const response = await axios.get('https://final-year-project-5wgk.onrender.com/api/songs/');
      
      const formattedSongs = response.data.map(song => ({
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        genre: song.genre || '',
        duration: song.duration || 180,
        releaseYear: song.releaseYear,
        audioUrl: song.audioUrl,
        isLocalAudio: song.isLocalAudio,
        isLocalImage: true,
        localAudioFileName: song.localAudioFileName
      }));
      
      setSongs(formattedSongs);
      await cacheSongAssetInfo(formattedSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongs(SAMPLE_SONGS);
      Alert.alert('Using sample music', 'Failed to load songs from server. Using sample data instead.');
    } finally {
      setIsLoadingSongs(false);
    }
  };

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
        'Ilayaraja - Kannupada Poguthaiya.mp3':require('../../assets/songs/Ilayaraja - Kannupada Poguthaiya.mp3'),
          'Ilayaraja - Sorkkame Endralum.mp3':require('../../assets/songs/Ilayaraja - Sorkkame Endralum.mp3'),
          'Ilayaraja - Thendral Vanthu Theendum Pothu.mp3':require('../../assets/songs/Ilayaraja - Thendral Vanthu Theendum Pothu.mp3'),
          'Ilayaraja - Thulli Ezhunthathu Pattu.mp3':require('../../assets/songs/Ilayaraja - Thulli Ezhunthathu Pattu.mp3'),
          'Ilayaraja - Indha Maan.mp3':require('../../assets/songs/Ilayaraja - Indha Maan.mp3'),
          'Ilayaraja - Janani Janani.mp3':require('../../assets/songs/Ilayaraja - Janani Janani.mp3'),
          'Ilayaraja - Nila Athu Vaanathumel.mp3':require('../../assets/songs/Ilayaraja - Nila Athu Vaanathumel.mp3'),
          'Ilayaraja - Thenpandi Cheemayile.mp3':require('../../assets/songs/Ilayaraja - Thenpandi Cheemayile.mp3'),
          'Ilayaraja - Kalyanamalai.mp3':require('../../assets/songs/Ilayaraja - Kalyanamalai.mp3'),
          'SPB - Chinnamani Kuyile.mp3':require('../../assets/songs/SPB - Chinnamani Kuyile.mp3'),
          'SPB - Mannil Indha Kaadhal.mp3':require('../../assets/songs/SPB - Mannil Indha Kaadhal.mp3'),
          'SPB - Nilave Mugam Kaatu.mp3':require('../../assets/songs/SPB - Nilave Mugam Kaatu.mp3'),
          'SPB - Thenmadurai Vaigai Nadhi.mp3':require('../../assets/songs/SPB - Thenmadurai Vaigai Nadhi.mp3'),
          'SPB - Valaiyosai.mp3':require('../../assets/songs/SPB - Valaiyosai.mp3'),
          'SPB - Anjali Anjali.mp3':require('../../assets/songs/SPB - Anjali Anjali.mp3'),
          'SPB - Yaaro.mp3':require('../../assets/songs/SPB - Yaaro.mp3'),
          'SPB - Nenjukkule Innarendru.mp3':require('../../assets/songs/SPB - Nenjukkule Innarendru.mp3'),
          'SPB - Mun Paniya.mp3':require('../../assets/songs/SPB - Mun Paniya.mp3'),
          'SPB - Velli Malare.mp3':require('../../assets/songs/SPB - Velli Malare.mp3'),
          'Janaki - Chinna Chinna.mp3':require('../../assets/songs/Janaki - Chinna Chinna.mp3'),
          'Janaki - Endhan Nenjil.mp3':require('../../assets/songs/Janaki - Endhan Nenjil.mp3'),
          'Janaki - Entha Poovilum Vaasam.mp3':require('../../assets/songs/Janaki - Entha Poovilum Vaasam.mp3'),
          'Janaki - Kaadhal Kaditham.mp3':require('../../assets/songs/Janaki - Kaadhal Kaditham.mp3'),
          'Janaki - Kaatril Enthan Geetham.mp3':require('../../assets/songs/Janaki - Kaatril Enthan Geetham.mp3'),
          'Janaki - Ooru Sanam.mp3':require('../../assets/songs/Janaki - Ooru Sanam.mp3'),
          'Janaki - Rasave Unna Nambi.mp3':require('../../assets/songs/Janaki - Rasave Unna Nambi.mp3'),
          'Janaki - Santhana Kaatre.mp3':require('../../assets/songs/Janaki - Santhana Kaatre.mp3'),
          'Janaki - Senthoora Poove.mp3':require('../../assets/songs/Janaki - Senthoora Poove.mp3'),
          'Janaki - Thendral Vanthu Ennai.mp3':require('../../assets/songs/Janaki - Thendral Vanthu Ennai.mp3'),
          'Hariharan - Anbae Anbae.mp3':require('../../assets/songs/Hariharan - Anbae Anbae.mp3'),
          'Hariharan - Chandiranai Thottathu.mp3':require('../../assets/songs/Hariharan - Chandiranai Thottathu.mp3'),
          'Hariharan - Ennai Thalatta.mp3':require('../../assets/songs/Hariharan - Ennai Thalatta.mp3'),
          'Hariharan - Irava Pagala.mp3':require('../../assets/songs/Hariharan - Irava Pagala.mp3'),
          'Hariharan - Irupathu Kodi.mp3':require('../../assets/songs/Hariharan - Irupathu Kodi.mp3'),
          'Hariharan - Kurukku Siruthavaley.mp3':require('../../assets/songs/Hariharan - Kurukku Siruthavaley.mp3'),
          'Hariharan - Minnal Oru Kodi.mp3':require('../../assets/songs/Hariharan - Minnal Oru Kodi.mp3'),
          'Hariharan - Oru Poiyavathu.mp3':require('../../assets/songs/Hariharan - Oru Poiyavathu.mp3'),
          'Hariharan - Pachai Nirame.mp3':require('../../assets/songs/Hariharan - Pachai Nirame.mp3'),
          'Hariharan - Un Per Solla.mp3':require('../../assets/songs/Hariharan - Un Per Solla.mp3'),
          'Melody - Kan Irandil.mp3':require('../../assets/songs/Melody - Kan Irandil.mp3'),
          'Melody - Kannalanae.mp3':require('../../assets/songs/Melody - Kannalanae.mp3'),
          'Melody - Malargal Kaettae.mp3':require('../../assets/songs/Melody - Malargal Kaettae.mp3'),
          'Melody - Melliname.mp3':require('../../assets/songs/Melody - Melliname.mp3'),
          'Melody - Munbe Vaa.mp3':require('../../assets/songs/Melody - Munbe Vaa.mp3'),
          'Melody - Mundhinam.mp3':require('../../assets/songs/Melody - Mundhinam.mp3'),
          'Melody - New York Nagaram.mp3':require('../../assets/songs/Melody - New York Nagaram.mp3'),
          'Melody - Partha Mudhal.mp3':require('../../assets/songs/Melody - Partha Mudhal.mp3'),
          'Melody - Poovukkul.mp3':require('../../assets/songs/Melody - Poovukkul.mp3'),
          'Melody - Vennilave Vennilave.mp3':require('../../assets/songs/Melody - Vennilave Vennilave.mp3'),
          'Yesudas - Agaram Ippo.mp3':require('../../assets/songs/Yesudas - Agaram Ippo.mp3'),
          'Yesudas - Kanne Kalaimane.mp3':require('../../assets/songs/Yesudas - Kanne Kalaimane.mp3'),
          'Yesudas - Mazhai varudhu.mp3':require('../../assets/songs/Yesudas - Mazhai varudhu.mp3'),
          'Yesudas - Oora therinjukitten.mp3':require('../../assets/songs/Yesudas - Oora therinjukitten.mp3'),
          'Yesudas - Pachai Kiligal.mp3':require('../../assets/songs/Yesudas - Pachai Kiligal.mp3'),
          'Yesudas - Poove sempoove.mp3':require('../../assets/songs/Yesudas - Poove sempoove.mp3'),
          'Yesudas - Pottu Vaitha.mp3':require('../../assets/songs/Yesudas - Pottu Vaitha.mp3'),
          'Yesudas - Raja Raja Chozhan.mp3':require('../../assets/songs/Yesudas - Raja Raja Chozhan.mp3'),
          'Yesudas - Senthazham Poovil.mp3':require('../../assets/songs/Yesudas - Senthazham Poovil.mp3'),
          'Yesudas - Un Paarvayil.mp3':require('../../assets/songs/Yesudas - Un Paarvayil.mp3'),
        // ... (other asset mappings remain the same)
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

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground:false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  };

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

  const playSong = async (song) => {
    if (isUnmounted.current) return;
    
    try {
      setIsLoading(true);
      
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      
      if (playbackPositionTimer.current) {
        clearInterval(playbackPositionTimer.current);
      }
      
      setCurrentSong(song);
      setPosition(0);
      setDuration(song.duration);
      
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

  const playNextSong = () => {
    if (!currentSong || !selectedArtist) return;
    
    const artistSongs = selectedArtist.songs;
    const currentIndex = artistSongs.findIndex(song => song.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % artistSongs.length;
    playSong(artistSongs[nextIndex]);
  };

  const playPreviousSong = () => {
    if (!currentSong || !selectedArtist) return;
    
    const artistSongs = selectedArtist.songs;
    const currentIndex = artistSongs.findIndex(song => song.id === currentSong.id);
    const previousIndex = (currentIndex - 1 + artistSongs.length) % artistSongs.length;
    playSong(artistSongs[previousIndex]);
  };

  const toggleExpandedPlayer = () => {
    setExpanded(!expanded);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderSongItem = ({ item }) => {
    const isActive = currentSong && currentSong.id === item.id;
    const isFavorite = favorites.has(item.id);
    
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles(theme).songItem, isActive && styles(theme).activeSong]} 
        onPress={() => playSong(item)}
      >
        <Image 
          source={item.coverImage}
          style={styles(theme).albumCover} 
          defaultSource={DEFAULT_COVER}
        />
        <View style={styles(theme).songInfo}>
          <Text style={[styles(theme).title, isActive && styles(theme).activeText]}>{item.title}</Text>
          <Text style={styles(theme).artist}>{item.album || item.artist}</Text>
        </View>
        <TouchableOpacity 
          onPress={(e) => toggleFavorite(item.id, e)}
          style={styles(theme).likeButton}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={22} 
            color={isFavorite ? "#FF0000" : "#888"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderArtistItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles(theme).artistItem} 
        onPress={() => setSelectedArtist(item)}
      >
        <Image 
          source={item.coverImage}
          style={styles(theme).artistCover} 
          defaultSource={DEFAULT_COVER}
        />
        <Text style={styles(theme).artistName}>{item.name}</Text>
        <Text style={styles(theme).songCount}>{item.songs.length} songs</Text>
      </TouchableOpacity>
    );
  };

  const SAMPLE_SONGS = [
    {
      id: '1',
      title: 'Hey Jude',
      artist: 'The Beatles',
      album: 'The Beatles 1967-1970',
      duration: 425,
      audioUrl: 'https://example.com/song1.mp3',
      coverImage: COVER_IMAGES['The Beatles'] || DEFAULT_COVER,
      isLocalAudio: true,
      localAudioFileName: 'The Beatles - Hey Jude.mp3'
    },
  ];

  const handleBack = () => {
    setSelectedArtist(null);
  };

  const renderExpandedPlayer = () => {
    if (!currentSong) return null;
    const isFavorite = favorites.has(currentSong.id);

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
            source={currentSong.coverImage}
            style={styles(theme).expandedCover}
            defaultSource={DEFAULT_COVER}
          />
          
          <View style={styles(theme).expandedSongInfo}>
            <Text style={styles(theme).expandedTitle}>{currentSong.title}</Text>
            <Text style={styles(theme).expandedArtist}>{currentSong.artist}</Text>
          </View>
          
          <View style={styles(theme).progressContainer}>
            <TouchableOpacity 
              onPress={(e) => toggleFavorite(currentSong.id, e)}
              style={styles(theme).expandedFavoriteButton}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={28} 
                color={isFavorite ? "#FF0000": "#888"} 
              />
            </TouchableOpacity>
            <Slider
              style={styles(theme).progressBar}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingStart={handleStartSeeking}
              onSlidingComplete={handleStopSeeking}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.divider}
              thumbTintColor={theme.primary}
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
              style={[styles(theme).expandedPlayButton, { backgroundColor: theme.primary }]}
              onPress={togglePlayPause}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.cardBackground} />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color={theme.cardBackground} 
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

  return (
    <SafeAreaView style={[styles(theme).container, { backgroundColor: theme.background }]}>  
      {/* Expanded Player */}
      {expanded && renderExpandedPlayer()}
      
      {/* Main Content Area */}
      {!expanded && (
        <View style={styles(theme).listContainer}>
          {selectedArtist ? (
            // Artist's songs view
            <>
              <View style={styles(theme).headerRow}>
                <TouchableOpacity onPress={handleBack} style={styles(theme).backButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles(theme).artistHeader}>
                  <Image 
                    source={selectedArtist.coverImage}
                    style={styles(theme).artistHeaderCover}
                    defaultSource={DEFAULT_COVER}
                  />
                  <View style={styles(theme).artistInfo}>
                    <Text style={styles(theme).artistHeaderName}>{selectedArtist.name}</Text>
                    <Text style={styles(theme).artistHeaderSongs}>{selectedArtist.songs.length} songs</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles(theme).artistPlayButton, { backgroundColor: theme.primary }]}
                onPress={() => selectedArtist.songs.length > 0 && playSong(selectedArtist.songs[0])}
              >
                <Ionicons name="play" size={22} color={theme.cardBackground} />
                <Text style={[styles(theme).artistPlayText, { color: theme.cardBackground }]}>Play</Text>
              </TouchableOpacity>
              
              <View style={[styles(theme).songListHeader, { borderBottomColor: theme.divider }]}>
                <Text style={styles(theme).songListHeaderTitle}>Songs</Text>
              </View>
              
              <ScrollView 
                contentContainerStyle={styles(theme).songList}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDarkMode ? 'white' : 'black'}
              >
                {selectedArtist.songs.map((item) => renderSongItem({item}))}
                <View style={styles(theme).listFooter} />
              </ScrollView>
            </>
          ) : (
            // Artists list view
            <>
              <View style={styles(theme).headerRow}>
                <Text style={[styles(theme).listTitle, { color: theme.text }]}>Artists</Text>
                <View style={styles(theme).headerActions}>
                  
                  <TouchableOpacity style={styles(theme).refreshButton} onPress={fetchSongs}>
                    <Ionicons name="refresh" size={22} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {isLoadingSongs ? (
                <View style={styles(theme).loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles(theme).loadingText, { color: theme.subText }]}>Loading music...</Text>
                </View>
              ) : (
                artists.length > 0 ? (
                  <FlatList
                    key="artistsGrid"
                    data={artists}
                    keyExtractor={(item) => item.name}
                    renderItem={renderArtistItem}
                    contentContainerStyle={styles(theme).artistList}
                    numColumns={2}
                    showsVerticalScrollIndicator={true}
                    indicatorStyle={isDarkMode ? 'white' : 'black'}
                  />
                ) : (
                  <View style={styles(theme).emptyContainer}>
                    <Text style={[styles(theme).emptyText, { color: theme.subText }]}>No artists available</Text>
                  </View>
                )
              )}
            </>
          )}
        </View>
      )}
      
      {/* Player Controls */}
      {!expanded && currentSong && (
        <View style={[styles(theme).playerBar, { backgroundColor: theme.cardBackground, borderTopColor: theme.divider }]}>
          <TouchableOpacity 
            style={styles(theme).playerContent}
            onPress={toggleExpandedPlayer}
          >
            <Image 
              source={currentSong.coverImage}
              style={styles(theme).miniCover}
              defaultSource={DEFAULT_COVER}
            />
            
            <View style={styles(theme).songDetails}>
              <Text style={[styles(theme).playerTitle, { color: theme.text }]}>{currentSong.title}</Text>
              <Text style={[styles(theme).playerArtist, { color: theme.subText }]}>{currentSong.artist}</Text>
            </View>
            
            <View style={styles(theme).controls}>
              <TouchableOpacity onPress={playPreviousSong} style={styles(theme).controlButton}>
                <Ionicons name="play-skip-back" size={28} color={theme.text} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles(theme).playButton} onPress={togglePlayPause}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={28} 
                    color={theme.text} 
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={playNextSong} style={styles(theme).controlButton}>
                <Ionicons name="play-skip-forward" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          
          <View style={[styles(theme).miniProgressContainer, { backgroundColor: theme.divider }]}>
            <View 
              style={[
                styles(theme).miniProgress, 
                { width: `${(position / (duration || 1)) * 100}%`, backgroundColor: theme.primary }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* Bottom Navigation */}
      <View style={[styles(theme).bottomNav, { backgroundColor: theme.cardBackground, borderTopColor: theme.divider }]}>
        <TouchableOpacity style={[styles(theme).navItem, styles(theme).activeNavItem]}>
          <Ionicons name="musical-notes" size={24} color={theme.primary} />
          <Text style={[styles(theme).navText, { color: theme.primary }]}>Music</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  
  // Header styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 10,
  },
  headerActions: {
    flexDirection: 'row',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    marginLeft: 10,
  },
  themeToggle: {
    padding: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  
  // Artists list
  artistList: {
    paddingVertical: 10,
  },
  artistItem: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 20,
    alignItems: 'center',
  },
  artistCover: {
    width: 100,
    height: 100,
    borderRadius: 75,
    marginBottom: 10,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: theme.text,
  },
  songCount: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.subText,
  },
  
  // Artist header
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistHeaderCover: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  artistInfo: {
    flex: 1,
  },
  artistHeaderName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.text,
  },
  artistHeaderSongs: {
    fontSize: 14,
    color: theme.subText,
  },
  artistPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  artistPlayText: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  
  // Song list
  songListHeader: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  songListHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  songList: {
    paddingBottom: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  activeSong: {
    backgroundColor: theme.divider,
  },
  albumCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    color: theme.text,
  },
  activeText: {
    color: theme.primary,
  },
  artist: {
    fontSize: 14,
    color: theme.subText,
  },
  likeButton: {
    padding: 10,
  },
  listFooter: {
    height: 100,
  },
  
  // Mini Player
  playerBar: {
    height: 64,
    borderTopWidth: 1,
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
    fontSize: 14,
    fontWeight: '500',
  },
  playerArtist: {
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
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  miniProgress: {
    height: 2,
  },
  
  // Expanded player
  expandedPlayerContainer: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: theme.background,
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.text,
  },
  expandedArtist: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    color: theme.subText,
  },
  expandedFavoriteButton: {
    padding: 10,
    marginLeft:320,
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
    fontSize: 14,
    color: theme.subText,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
  },
  
  // Bottom navigation
  bottomNav: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {
    borderTopWidth: 2,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ArtistMusicPlayer;