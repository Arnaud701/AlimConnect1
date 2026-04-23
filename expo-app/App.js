import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const heroImage = require('./assets/panier.png');

const categories = ['Tous', 'Boulangerie', 'Produits laitiers', 'Fruits & Légumes', 'Plats préparés', 'Viandes', 'Boissons', 'Autre'];

const initialProducts = [
  {
    id: '1',
    name: 'Yaourts nature bio (x6)',
    description: 'Lot de 6 yaourts nature bio, texture onctueuse et goût authentique.',
    originalPrice: 4.2,
    reducedPrice: 1.5,
    expiryDate: '2026-03-23',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    category: 'Produits laitiers',
    sellerId: '1',
    quantity: 8,
  },
  {
    id: '2',
    name: 'Baguettes tradition (x3)',
    description: 'Baguettes tradition croustillantes du jour.',
    originalPrice: 3.9,
    reducedPrice: 1.2,
    expiryDate: '2026-03-22',
    image: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=400&h=300&fit=crop',
    category: 'Boulangerie',
    sellerId: '4',
    quantity: 5,
  },
  {
    id: '3',
    name: 'Salade composée',
    description: 'Salade fraîche avec poulet grillé, tomates cerises et vinaigrette maison.',
    originalPrice: 6.5,
    reducedPrice: 2.8,
    expiryDate: '2026-03-22',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    category: 'Plats préparés',
    sellerId: '2',
    quantity: 3,
  },
  {
    id: '4',
    name: 'Lot de fruits variés',
    description: 'Pommes, bananes et oranges légèrement abîmées.',
    originalPrice: 5.0,
    reducedPrice: 1.9,
    expiryDate: '2026-03-24',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop',
    category: 'Fruits & Légumes',
    sellerId: '3',
    quantity: 12,
  },
  {
    id: '5',
    name: 'Croissants au beurre (x4)',
    description: 'Croissants pur beurre feuilletés, dorés à souhait.',
    originalPrice: 4.8,
    reducedPrice: 1.6,
    expiryDate: '2026-03-22',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=300&fit=crop',
    category: 'Boulangerie',
    sellerId: '4',
    quantity: 6,
  },
  {
    id: '6',
    name: 'Fromage camembert',
    description: 'Camembert de Normandie AOP, affiné au lait cru.',
    originalPrice: 3.8,
    reducedPrice: 1.4,
    expiryDate: '2026-03-25',
    image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=300&fit=crop',
    category: 'Produits laitiers',
    sellerId: '1',
    quantity: 4,
  },
];

const sellerUsers = [
  { id: '1', email: 'seller1@example.com', password: 'seller123', name: 'Carrefour City' },
  { id: '4', email: 'seller2@example.com', password: 'seller123', name: 'La Boulangerie du Coin' },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState('Home');
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerUser, setSellerUser] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Boulangerie',
    originalPrice: '',
    reducedPrice: '',
    expiryDate: '',
    quantity: '1',
  });
  const [productImage, setProductImage] = useState(null);

  const filteredProducts = useMemo(() => {
    const search = searchText.toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search) || product.description.toLowerCase().includes(search);
      const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, selectedCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = products.find((product) => product.id === item.productId);
      if (!product) return sum;
      return sum + product.reducedPrice * item.quantity;
    }, 0);
  }, [cart, products]);

  const sellerProducts = useMemo(() => {
    if (!sellerUser) return [];
    return products.filter((product) => product.sellerId === sellerUser.id);
  }, [products, sellerUser]);

  const updateForm = (field, value) => setProductForm((prev) => ({ ...prev, [field]: value }));

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
    Alert.alert('Ajouté au panier', `${product.name} a été ajouté à votre panier.`);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const loginSeller = () => {
    const user = sellerUsers.find(
      (seller) => seller.email === sellerEmail.trim().toLowerCase() && seller.password === sellerPassword
    );

    if (!user) {
      Alert.alert('Connexion impossible', 'Email ou mot de passe invalide.');
      return;
    }

    setSellerUser(user);
    setSellerEmail('');
    setSellerPassword('');
    setAddMode(false);
    Alert.alert('Bienvenue', `Bonjour ${user.name} !`);
  };

  const logoutSeller = () => {
    setSellerUser(null);
    setAddMode(false);
  };

  const requestMediaLibraryPermission = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission refusée', 'L’application n’a pas la permission d’accéder aux photos.');
    }
    return granted;
  };

  const requestCameraPermission = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission refusée', 'L’application n’a pas la permission d’utiliser la caméra.');
    }
    return granted;
  };

  const pickImageFromLibrary = async () => {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProductImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProductImage(result.assets[0].uri);
    }
  };

  const handleAddProduct = () => {
    if (!productImage) {
      Alert.alert('Image requise', 'Veuillez choisir ou prendre une photo du produit.');
      return;
    }
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.expiryDate.trim()) {
      Alert.alert('Formulaire incomplet', 'Veuillez remplir tous les champs du produit.');
      return;
    }

    const newProduct = {
      id: Date.now().toString(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      originalPrice: parseFloat(productForm.originalPrice) || 0,
      reducedPrice: parseFloat(productForm.reducedPrice) || 0,
      expiryDate: productForm.expiryDate,
      quantity: Math.max(1, parseInt(productForm.quantity, 10) || 1),
      image: productImage,
      category: productForm.category,
      sellerId: sellerUser?.id || '1',
    };

    setProducts((prev) => [newProduct, ...prev]);
    setProductImage(null);
    setProductForm({
      name: '',
      description: '',
      category: 'Boulangerie',
      originalPrice: '',
      reducedPrice: '',
      expiryDate: '',
      quantity: '1',
    });
    setAddMode(false);
    Alert.alert('Produit créé', `${newProduct.name} a bien été ajouté.`);
  };

  const formatPrice = (value) => `${value.toFixed(2)} €`;

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.heroContainer}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroBadge}>Jusqu'à -70%</Text>
          <Text style={styles.heroTitle}>Sauvez des aliments, faites des économies</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionCard, styles.actionPrimary]} onPress={() => setActiveScreen('Marketplace')}>
            <Text style={styles.actionTitle}>Acheter</Text>
            <Text style={styles.actionSubtitle}>Invendus dispo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionSecondary]} onPress={() => setActiveScreen('Seller')}>
            <Text style={styles.actionTitle}>Vendre</Text>
            <Text style={styles.actionSubtitle}>Espace pro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderMarketplace = () => (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.screenTitle}>Marketplace</Text>
      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Rechercher un produit..."
        style={styles.input}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={selectedCategory === category ? styles.categoryTextActive : styles.categoryText}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredProducts.map((product) => (
        <View key={product.id} style={styles.productCard}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
            <View style={styles.productRow}>
              <Text style={styles.productPrice}>{formatPrice(product.reducedPrice)}</Text>
              {product.originalPrice > product.reducedPrice && (
                <Text style={styles.productOriginal}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => addToCart(product)}>
              <Text style={styles.buttonText}>Ajouter au panier</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {filteredProducts.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun produit trouvé.</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderCart = () => (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.screenTitle}>Panier</Text>
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Votre panier est vide.</Text>
        </View>
      ) : (
        cart.map((item) => {
          const product = products.find((product) => product.id === item.productId);
          if (!product) return null;
          return (
            <View key={item.productId} style={styles.cartCard}>
              <Image source={{ uri: product.image }} style={styles.cartImage} />
              <View style={styles.cartInfo}>
                <Text style={styles.productTitle}>{product.name}</Text>
                <Text style={styles.productDescription}>Quantité: {item.quantity}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.reducedPrice * item.quantity)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                  <Text style={styles.removeText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
      {cart.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Total: {formatPrice(cartTotal)}</Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => Alert.alert('Commande', 'Votre commande a été prise en compte !')}>
            <Text style={styles.buttonText}>Valider le panier</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderSeller = () => {
    if (!sellerUser) {
      return (
        <ScrollView contentContainerStyle={styles.screen}>
          <Text style={styles.screenTitle}>Espace vendeur</Text>
          <TextInput
            value={sellerEmail}
            onChangeText={setSellerEmail}
            placeholder="Email"
            style={styles.input}
            autoCapitalize="none"
          />
          <TextInput
            value={sellerPassword}
            onChangeText={setSellerPassword}
            placeholder="Mot de passe"
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity style={styles.buttonPrimary} onPress={loginSeller}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>Utilisez seller1@example.com / seller123 ou seller2@example.com / seller123</Text>
          </View>
        </ScrollView>
      );
    }

    if (addMode) {
      return (
        <ScrollView contentContainerStyle={styles.screen}>
          <Text style={styles.screenTitle}>Ajouter un produit</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImageFromLibrary}>
            <Text style={styles.imagePickerText}>Choisir une image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imagePicker} onPress={takePhoto}>
            <Text style={styles.imagePickerText}>Prendre une photo</Text>
          </TouchableOpacity>
          {productImage && <Image source={{ uri: productImage }} style={styles.previewImage} />}
          <TextInput
            value={productForm.name}
            onChangeText={(text) => updateForm('name', text)}
            placeholder="Nom du produit"
            style={styles.input}
          />
          <TextInput
            value={productForm.description}
            onChangeText={(text) => updateForm('description', text)}
            placeholder="Description"
            style={[styles.input, styles.textArea]}
            multiline
          />
          <TextInput
            value={productForm.category}
            onChangeText={(text) => updateForm('category', text)}
            placeholder="Catégorie"
            style={styles.input}
          />
          <TextInput
            value={productForm.originalPrice}
            onChangeText={(text) => updateForm('originalPrice', text)}
            placeholder="Prix normal"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            value={productForm.reducedPrice}
            onChangeText={(text) => updateForm('reducedPrice', text)}
            placeholder="Prix réduit"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            value={productForm.expiryDate}
            onChangeText={(text) => updateForm('expiryDate', text)}
            placeholder="Date de péremption (YYYY-MM-DD)"
            style={styles.input}
          />
          <TextInput
            value={productForm.quantity}
            onChangeText={(text) => updateForm('quantity', text)}
            placeholder="Quantité"
            keyboardType="numeric"
            style={styles.input}
          />
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleAddProduct}>
            <Text style={styles.buttonText}>Publier le produit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => setAddMode(false)}>
            <Text style={styles.buttonSecondaryText}>Annuler</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.screenTitle}>Bonjour {sellerUser.name}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{sellerProducts.length}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cart.filter((item) => sellerProducts.some((product) => product.id === item.productId)).length}</Text>
            <Text style={styles.statLabel}>Ventes</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => setAddMode(true)}>
          <Text style={styles.buttonText}>Ajouter un produit</Text>
        </TouchableOpacity>
        {sellerProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              <Text style={styles.productCategory}>{product.category}</Text>
            </View>
          </View>
        ))}
        {sellerProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Vous n'avez pas encore de produits.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.buttonSecondary} onPress={logoutSeller}>
          <Text style={styles.buttonSecondaryText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Marketplace':
        return renderMarketplace();
      case 'Cart':
        return renderCart();
      case 'Seller':
        return renderSeller();
      default:
        return renderHome();
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <View style={styles.tabBar}>
        {['Home', 'Marketplace', 'Cart', 'Seller'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tabButton, activeScreen === item && styles.tabButtonActive]}
            onPress={() => setActiveScreen(item)}
          >
            <Text style={activeScreen === item ? styles.tabTextActive : styles.tabText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screen: {
    padding: 16,
    paddingBottom: 100,
  },
  heroContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroBadge: {
    color: '#fff',
    backgroundColor: '#0f766e',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  actionPrimary: {
    backgroundColor: '#0f172a',
  },
  actionSecondary: {
    backgroundColor: '#e2e8f0',
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  actionSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 14,
  },
  categoryButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#0f172a',
  },
  categoryText: {
    color: '#334155',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productInfo: {
    padding: 14,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    color: '#0f172a',
  },
  productDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  productOriginal: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  buttonPrimary: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f172a',
    marginTop: 10,
  },
  buttonSecondaryText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cartImage: {
    width: 120,
    height: 120,
  },
  cartInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  removeText: {
    color: '#dc2626',
    fontWeight: '700',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#0f172a',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  noteBox: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
  },
  noteText: {
    color: '#475569',
    fontSize: 13,
  },
  imagePicker: {
    backgroundColor: '#e2e8f0',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
  },
});
