import React, {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import {API_BASE_URL} from '../config/env';

// Error boundary class component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong!</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => this.setState({hasError: false})}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const StoreDetailsScreen = ({route}) => {
  const {barcodeId} = route.params;
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [animation] = useState(new Animated.Value(0));
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDiscountedPrice, setTotalDiscountedPrice] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/stores/${barcodeId}`);
        if (!response.data || !response.data.store) {
          throw new Error('Invalid store data received');
        }
        setStoreData(response.data);
      } catch (error) {
        console.error('Error fetching store details:', error);
        Alert.alert(
          'Error',
          'Failed to fetch store details. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => fetchStoreDetails(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetails();
  }, [barcodeId]);

  // Calculate price with discount applied
  const getDiscountedPrice = (mrp, discount) => {
    return mrp - (mrp * discount) / 100;
  };

  // Increment Quantity & Update Cart
  const handleIncrement = item => {
    setStoreData(prevStoreData => ({
      ...prevStoreData,
      items: prevStoreData.items.map(i =>
        i._id === item._id ? {...i, quantity: (i.quantity || 0) + 1} : i,
      ),
    }));

    setCartItems(prevCartItems => {
      const existingItem = prevCartItems.find(ci => ci.item === item._id);
      let updatedCart;
      if (existingItem) {
        updatedCart = prevCartItems.map(ci =>
          ci.item === item._id ? {...ci, quantity: ci.quantity + 1} : ci,
        );
      } else {
        updatedCart = [
          ...prevCartItems,
          {
            item: item._id,
            quantity: 1,
            price: item.mrp,
            discount: item.discount,
            discountedPrice: getDiscountedPrice(item.mrp, item.discount),
          },
        ];
      }
      updateTotalPrices(updatedCart);
      return updatedCart;
    });
  };

  // Decrement Quantity & Update Cart
  const handleDecrement = item => {
    setStoreData(prevStoreData => ({
      ...prevStoreData,
      items: prevStoreData.items.map(i =>
        i._id === item._id
          ? {...i, quantity: Math.max((i.quantity || 0) - 1, 0)}
          : i,
      ),
    }));

    setCartItems(prevCartItems => {
      const existingItem = prevCartItems.find(ci => ci.item === item._id);
      let updatedCart;
      if (existingItem && existingItem.quantity > 1) {
        updatedCart = prevCartItems.map(ci =>
          ci.item === item._id ? {...ci, quantity: ci.quantity - 1} : ci,
        );
      } else {
        updatedCart = prevCartItems.filter(ci => ci.item !== item._id);
      }
      updateTotalPrices(updatedCart);
      return updatedCart;
    });
  };

  // Update Total Prices (both original and discounted)
  const updateTotalPrices = cart => {
    const originalTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const discountedTotal = cart.reduce(
      (sum, item) => sum + item.discountedPrice * item.quantity,
      0,
    );

    setTotalPrice(originalTotal);
    setTotalDiscountedPrice(discountedTotal);
  };

  const validateOrderData = () => {
    if (!storeData?.store?._id) {
      throw new Error('Store information is not available');
    }
    if (!cartItems.length) {
      throw new Error('Cart is empty');
    }
    if (cartItems.some(item => !item.quantity || item.quantity <= 0)) {
      throw new Error('Invalid item quantity in cart');
    }
    if (totalDiscountedPrice <= 0) {
      throw new Error('Invalid order total');
    }
    return true;
  };

  // Place Order
  const placeOrder = async () => {
    if (isPlacingOrder) return;

    setIsPlacingOrder(true);
    try {
      // Validate order data
      validateOrderData();

      const response = await axios.post(`${API_BASE_URL}/orders`, {
        items: cartItems,
        mobile: '9672281491', // This should come from user context/state
        store: storeData.store._id,
        total: totalDiscountedPrice,
        status: 'Pending',
      });

      if (!response.data) {
        throw new Error('Failed to create order');
      }

      Alert.alert(
        'Order Successful',
        'Your order has been placed successfully!',
        [{text: 'OK', onPress: () => console.log('OK Pressed')}],
      );
      setCartItems([]);
      setTotalPrice(0);
      setTotalDiscountedPrice(0);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Something went wrong. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => placeOrder(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const toggleCategory = categoryId => {
    if (expandedCategory === categoryId) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setExpandedCategory(null));
    } else {
      setExpandedCategory(categoryId);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const groupItemsByCategory = () => {
    if (!storeData) return [];
    return storeData.categories.map(category => {
      const itemsInCategory = storeData.items.filter(
        item => item.category === category._id,
      );
      return {...category, items: itemsInCategory};
    });
  };

  // Calculate total savings
  const calculateSavings = () => {
    return totalPrice - totalDiscountedPrice;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading store details...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.storeName}>{storeData?.store?.name}</Text>
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </View>

          <FlatList
            data={groupItemsByCategory()}
            keyExtractor={category => category._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({item: category}) => (
              <Animated.View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryHeader,
                    expandedCategory === category._id &&
                      styles.categoryHeaderActive,
                  ]}
                  onPress={() => toggleCategory(category._id)}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Animated.Text
                    style={[
                      styles.dropdownArrow,
                      {
                        transform: [
                          {
                            rotate: animation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '180deg'],
                            }),
                          },
                        ],
                      },
                    ]}>
                    ▼
                  </Animated.Text>
                </TouchableOpacity>

                {expandedCategory === category._id && (
                  <Animated.View
                    style={[
                      styles.itemsContainer,
                      {
                        opacity: animation,
                        transform: [
                          {
                            translateY: animation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-20, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <FlatList
                      data={category.items}
                      keyExtractor={item => item._id}
                      scrollEnabled={false}
                      renderItem={({item}) => (
                        <View style={styles.itemContainer}>
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <View style={styles.priceContainer}>
                              <Text style={styles.itemPrice}>₹{item.mrp}</Text>
                              {item.discount > 0 && (
                                <View style={styles.discountBadge}>
                                  <Text style={styles.itemDiscount}>
                                    {item.discount}% OFF
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.counterContainer}>
                            <TouchableOpacity
                              style={[
                                styles.counterButton,
                                {opacity: item.quantity ? 1 : 0.5},
                              ]}
                              onPress={() => handleDecrement(item)}>
                              <Text style={styles.counterButtonText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterText}>
                              {item.quantity || 0}
                            </Text>
                            <TouchableOpacity
                              style={styles.counterButton}
                              onPress={() => handleIncrement(item)}>
                              <Text style={styles.counterButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    />
                  </Animated.View>
                )}
              </Animated.View>
            )}
          />

          {cartItems.length > 0 && (
            <Animated.View style={styles.cartSummary}>
              <View style={styles.priceSummary}>
                <Text style={styles.originalPriceLabel}>Original Price</Text>
                <Text style={styles.originalPriceValue}>
                  ₹{totalPrice.toFixed(2)}
                </Text>
              </View>

              {calculateSavings() > 0 && (
                <View style={styles.savingsContainer}>
                  <Text style={styles.savingsLabel}>Your Savings</Text>
                  <Text style={styles.savingsValue}>
                    ₹{calculateSavings().toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.discountedPriceContainer}>
                <Text style={styles.discountedPriceLabel}>Final Price</Text>
                <Text style={styles.discountedPriceValue}>
                  ₹{totalDiscountedPrice.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.orderButton, isPlacingOrder && {opacity: 0.7}]}
                onPress={placeOrder}
                disabled={isPlacingOrder}
                activeOpacity={0.8}>
                <Text style={styles.orderButtonText}>
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6366F1',
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
  cartBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  listContainer: {
    padding: 16,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  categoryHeaderActive: {
    backgroundColor: '#6366F1',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#6B7280',
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  discountBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  itemDiscount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  counterButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 6,
  },
  counterButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  counterText: {
    width: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cartSummary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  originalPriceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  originalPriceValue: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  savingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: '#DEF7EC',
    padding: 8,
    borderRadius: 8,
  },
  savingsLabel: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  savingsValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  discountedPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  discountedPriceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  discountedPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  orderButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StoreDetailsScreen;
