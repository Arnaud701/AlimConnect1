import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  sendPhoneOTP,
  verifyPhoneOTP,
  signInWithGoogle,
  UserRole,
} from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

type AuthMethod = 'email' | 'phone';

export default function AuthScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role: string }>();
  const insets = useSafeAreaInsets();
  const { loading: authLoading } = useAuth();

  const role: UserRole =
    roleParam === 'client' || roleParam === 'seller' ? roleParam : 'client';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [method, setMethod] = useState<AuthMethod>('email');
  const [otpStep, setOtpStep] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const user = getCurrentUser();
      if (user && user.role === role) {
        router.replace(user.role === 'seller' ? '/seller/dashboard' : ('/marketplace' as any));
      }
    }
  }, [authLoading, role]);

  const navigate = (user: { role: UserRole }) => {
    router.replace(user.role === 'seller' ? '/seller/dashboard' : ('/marketplace' as any));
  };

  const handleEmailSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const user = await loginUser(role, email, '', password);
        navigate(user);
      } else {
        const user = await registerUser(role, firstName, lastName, email, '', password);
        setSuccess('Compte créé ! Vérifiez votre email si demandé.');
        setTimeout(() => navigate(user), 800);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'authentification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSend = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await sendPhoneOTP(phone);
      setOtpStep(true);
      setSuccess('Code envoyé par SMS.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi du SMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await verifyPhoneOTP(phone, otp, role);
      navigate(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const url = await signInWithGoogle(role);
      if (!url) throw new Error('Impossible d\'obtenir l\'URL Google.');

      const result = await WebBrowser.openAuthSessionAsync(url, 'alimconnect://');
      if (result.type === 'success') {
        const urlObj = new URL(result.url);
        const params = new URLSearchParams(urlObj.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur Google Sign-In.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full mt-1 px-3 py-3 rounded-xl border border-border bg-background text-sm text-foreground';

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCFCFC' }}>
        <ActivityIndicator size="large" color="#1F5134" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FCFCFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }} className="bg-card border-b border-border">
        <View className="flex-row items-center h-14 px-4">
          <Text className="text-lg font-bold text-foreground">
            {role === 'seller' ? 'Espace vendeur' : 'Espace client'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bouton Google */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-border bg-card py-3 flex-row items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
        >
          <Text className="text-sm font-semibold text-foreground">
            Continuer avec Google
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-xs text-muted-foreground">ou</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Sélecteur méthode */}
        <View className="flex-row gap-2">
          {(['email', 'phone'] as AuthMethod[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => { setMethod(m); setOtpStep(false); setError(null); }}
              className={`flex-1 py-2 rounded-xl items-center ${method === m ? 'bg-primary' : 'bg-muted'}`}
            >
              <Text className={`text-xs font-semibold ${method === m ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {m === 'email' ? 'Email + mot de passe' : 'Numéro de téléphone'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="bg-card rounded-2xl border border-border p-5 shadow-sm gap-3">
          <Text className="text-base font-bold text-foreground">
            {mode === 'login' ? 'Connexion' : 'Création de compte'}
          </Text>

          {/* ── Méthode EMAIL ─────────────────────────────────── */}
          {method === 'email' && (
            <>
              {mode === 'signup' && (
                <>
                  <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase">Prénom</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Prénom"
                      placeholderTextColor="#677E73"
                      className={inputClass}
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase">Nom</Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Nom"
                      placeholderTextColor="#677E73"
                      className={inputClass}
                    />
                  </View>
                </>
              )}
              <View>
                <Text className="text-xs font-medium text-muted-foreground uppercase">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="exemple@domain.com"
                  placeholderTextColor="#677E73"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={inputClass}
                />
              </View>
              <View>
                <Text className="text-xs font-medium text-muted-foreground uppercase">Mot de passe</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#677E73"
                  secureTextEntry
                  className={inputClass}
                />
              </View>

              {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
              {success ? <Text className="text-xs text-green-600">{success}</Text> : null}

              <Pressable
                onPress={handleEmailSubmit}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary py-3 items-center active:opacity-80 disabled:opacity-60"
              >
                <Text className="text-primary-foreground text-sm font-semibold">
                  {isSubmitting ? 'Traitement...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
                </Text>
              </Pressable>
            </>
          )}

          {/* ── Méthode TÉLÉPHONE ─────────────────────────────── */}
          {method === 'phone' && !otpStep && (
            <>
              {mode === 'signup' && (
                <>
                  <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase">Prénom</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Prénom"
                      placeholderTextColor="#677E73"
                      className={inputClass}
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase">Nom</Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Nom"
                      placeholderTextColor="#677E73"
                      className={inputClass}
                    />
                  </View>
                </>
              )}
              <View>
                <Text className="text-xs font-medium text-muted-foreground uppercase">Numéro de téléphone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+221 77 000 00 00"
                  placeholderTextColor="#677E73"
                  keyboardType="phone-pad"
                  className={inputClass}
                />
              </View>

              {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
              {success ? <Text className="text-xs text-green-600">{success}</Text> : null}

              <Pressable
                onPress={handlePhoneSend}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary py-3 items-center active:opacity-80 disabled:opacity-60"
              >
                <Text className="text-primary-foreground text-sm font-semibold">
                  {isSubmitting ? 'Envoi...' : 'Recevoir le code SMS'}
                </Text>
              </Pressable>
            </>
          )}

          {/* ── Vérification OTP ─────────────────────────────── */}
          {method === 'phone' && otpStep && (
            <>
              <Text className="text-sm text-muted-foreground">
                Code envoyé au {phone}
              </Text>
              <View>
                <Text className="text-xs font-medium text-muted-foreground uppercase">Code SMS</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="123456"
                  placeholderTextColor="#677E73"
                  keyboardType="number-pad"
                  maxLength={6}
                  className={inputClass}
                />
              </View>

              {error ? <Text className="text-xs text-destructive">{error}</Text> : null}

              <Pressable
                onPress={handleOtpVerify}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary py-3 items-center active:opacity-80 disabled:opacity-60"
              >
                <Text className="text-primary-foreground text-sm font-semibold">
                  {isSubmitting ? 'Vérification...' : 'Valider le code'}
                </Text>
              </Pressable>
              <Pressable onPress={() => { setOtpStep(false); setError(null); }}>
                <Text className="text-xs text-primary font-medium text-center">
                  Changer le numéro
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Switcher login/signup & rôle */}
        <View className="flex-row justify-between items-center">
          {method === 'email' && (
            <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
              <Text className="text-xs text-primary font-medium">
                {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.replace(`/auth/${role === 'seller' ? 'client' : 'seller'}` as any)}>
            <Text className="text-xs text-primary font-medium">
              {role === 'seller' ? 'Passer au client' : 'Passer au vendeur'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
