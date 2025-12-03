import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS } from '../../config';
import Icon from '../common/Icon';

const { width, height } = Dimensions.get('window');

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentIndex(index);
  };

  const renderImage = ({ item }: { item: string }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setIsFullScreen(true)}
    >
      <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
    </TouchableOpacity>
  );

  const renderFullScreenImage = ({ item }: { item: string }) => (
    <Image
      source={{ uri: item }}
      style={styles.fullScreenImage}
      resizeMode="contain"
    />
  );

  const renderDot = (_: any, index: number) => (
    <View
      key={index}
      style={[styles.dot, index === currentIndex && styles.activeDot]}
    />
  );

  const renderThumbnail = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      onPress={() => {
        setCurrentIndex(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
      }}
    >
      <Image
        source={{ uri: item }}
        style={[
          styles.thumbnail,
          index === currentIndex && styles.activeThumbnail,
        ]}
      />
    </TouchableOpacity>
  );

  if (images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Icon name="image-outline" size={48} color={COLORS.gray[300]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <View style={styles.pagination}>
        {images.map(renderDot)}
      </View>

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>

      {images.length > 1 && (
        <FlatList
          data={images}
          renderItem={renderThumbnail}
          keyExtractor={(_, index) => `thumb-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailList}
          contentContainerStyle={styles.thumbnailContent}
        />
      )}

      <Modal
        visible={isFullScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullScreen(false)}
          >
            <Icon name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>

          <FlatList
            data={images}
            renderItem={renderFullScreenImage}
            keyExtractor={(_, index) => `full-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.gray[100],
  },
  image: {
    width: width,
    height: 300,
  },
  placeholder: {
    width: width,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 65,
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: COLORS.white,
    width: 26,
  },
  counter: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  thumbnailList: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
  },
  thumbnailContent: {
    paddingHorizontal: 14,
    gap: 10,
  },
  thumbnail: {
    width: 54,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: COLORS.white,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
});

export default ImageGallery;
