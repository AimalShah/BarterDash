import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  CreditCard,
  Calendar,
  Lock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Card, CardContent } from '../ui/Card';

interface PaymentMethodValidationProps {
  onValidationChange?: (isValid: boolean, cardData: CardData) => void;
  initialData?: Partial<CardData>;
  disabled?: boolean;
}

interface CardData {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  name: string;
}

interface ValidationErrors {
  number?: string;
  expiry?: string;
  cvc?: string;
  name?: string;
}

const CARD_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
};

export const PaymentMethodValidation: React.FC<PaymentMethodValidationProps> = ({
  onValidationChange,
  initialData,
  disabled = false,
}) => {
  const [cardData, setCardData] = useState<CardData>({
    number: initialData?.number || '',
    expiryMonth: initialData?.expiryMonth || '',
    expiryYear: initialData?.expiryYear || '',
    cvc: initialData?.cvc || '',
    name: initialData?.name || '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [cardBrand, setCardBrand] = useState<string>('');

  const expiryRef = useRef<TextInput>(null);
  const cvcRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    validateCard();
  }, [cardData]);

  const detectCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    
    if (CARD_PATTERNS.visa.test(cleanNumber)) return 'visa';
    if (CARD_PATTERNS.mastercard.test(cleanNumber)) return 'mastercard';
    if (CARD_PATTERNS.amex.test(cleanNumber)) return 'amex';
    if (CARD_PATTERNS.discover.test(cleanNumber)) return 'discover';
    
    return '';
  };

  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, '');
    const brand = detectCardBrand(cleanValue);
    
    if (brand === 'amex') {
      // American Express: 4-6-5 format
      return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    } else {
      // Other cards: 4-4-4-4 format
      return cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
  };

  const formatExpiry = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  const validateCardNumber = (number: string): string | undefined => {
    const cleanNumber = number.replace(/\s/g, '');
    
    if (!cleanNumber) return 'Card number is required';
    if (cleanNumber.length < 13) return 'Card number is too short';
    if (cleanNumber.length > 19) return 'Card number is too long';
    if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits';
    
    // Luhn algorithm validation
    if (!isValidLuhn(cleanNumber)) return 'Invalid card number';
    
    return undefined;
  };

  const validateExpiry = (month: string, year: string): string | undefined => {
    if (!month || !year) return 'Expiry date is required';
    
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) return 'Invalid month';
    if (yearNum < 0 || yearNum > 99) return 'Invalid year';
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return 'Card has expired';
    }
    
    return undefined;
  };

  const validateCVC = (cvc: string, brand: string): string | undefined => {
    if (!cvc) return 'CVC is required';
    if (!/^\d+$/.test(cvc)) return 'CVC must contain only digits';
    
    const expectedLength = brand === 'amex' ? 4 : 3;
    if (cvc.length !== expectedLength) {
      return `CVC must be ${expectedLength} digits`;
    }
    
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Cardholder name is required';
    if (name.trim().length < 2) return 'Name is too short';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name must contain only letters and spaces';
    
    return undefined;
  };

  const isValidLuhn = (number: string): boolean => {
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const validateCard = () => {
    const newErrors: ValidationErrors = {};
    const brand = detectCardBrand(cardData.number);
    setCardBrand(brand);
    
    // Validate card number
    const numberError = validateCardNumber(cardData.number);
    if (numberError) newErrors.number = numberError;
    
    // Validate expiry
    const expiryError = validateExpiry(cardData.expiryMonth, cardData.expiryYear);
    if (expiryError) newErrors.expiry = expiryError;
    
    // Validate CVC
    const cvcError = validateCVC(cardData.cvc, brand);
    if (cvcError) newErrors.cvc = cvcError;
    
    // Validate name
    const nameError = validateName(cardData.name);
    if (nameError) newErrors.name = nameError;
    
    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange?.(isValid, cardData);
  };

  const handleCardNumberChange = (value: string) => {
    const cleanValue = value.replace(/\s/g, '');
    if (cleanValue.length <= 19) {
      const formatted = formatCardNumber(cleanValue);
      setCardData(prev => ({ ...prev, number: formatted }));
      
      // Auto-advance to expiry field when card number is complete
      if (cleanValue.length >= 13 && !errors.number) {
        expiryRef.current?.focus();
      }
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 4) {
      const formatted = formatExpiry(cleanValue);
      const month = cleanValue.substring(0, 2);
      const year = cleanValue.substring(2, 4);
      
      setCardData(prev => ({
        ...prev,
        expiryMonth: month,
        expiryYear: year,
      }));
      
      // Auto-advance to CVC field when expiry is complete
      if (cleanValue.length === 4) {
        cvcRef.current?.focus();
      }
    }
  };

  const handleCVCChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const maxLength = cardBrand === 'amex' ? 4 : 3;
    
    if (cleanValue.length <= maxLength) {
      setCardData(prev => ({ ...prev, cvc: cleanValue }));
      
      // Auto-advance to name field when CVC is complete
      if (cleanValue.length === maxLength) {
        nameRef.current?.focus();
      }
    }
  };

  const handleNameChange = (value: string) => {
    setCardData(prev => ({ ...prev, name: value }));
  };

  const getCardIcon = () => {
    switch (cardBrand) {
      case 'visa':
      case 'mastercard':
      case 'amex':
      case 'discover':
        return <CreditCard size={20} color={COLORS.primaryGold} />;
      default:
        return <CreditCard size={20} color={COLORS.textMuted} />;
    }
  };

  const renderError = (error?: string) => {
    if (!error) return null;
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <AlertCircle size={12} color={COLORS.errorRed} />
        <Text style={{ color: COLORS.errorRed, fontSize: 12, marginLeft: 4 }}>
          {error}
        </Text>
      </View>
    );
  };

  const renderSuccess = () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <CheckCircle size={12} color={COLORS.successGreen} />
        <Text style={{ color: COLORS.successGreen, fontSize: 12, marginLeft: 4 }}>
          Valid
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: keyboardHeight + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <CardContent style={{ padding: 20 }}>
            {/* Card Number */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ 
                color: COLORS.textSecondary, 
                fontSize: 12, 
                fontWeight: '600', 
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Card Number
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.luxuryBlackLighter,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: focused === 'number' ? COLORS.primaryGold : 
                           errors.number ? COLORS.errorRed : COLORS.darkBorder,
                paddingHorizontal: 16,
                minHeight: 56, // Large touch target
              }}>
                {getCardIcon()}
                <TextInput
                  style={{
                    flex: 1,
                    color: COLORS.textPrimary,
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: 12,
                    letterSpacing: 1,
                  }}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={COLORS.textMuted}
                  value={cardData.number}
                  onChangeText={handleCardNumberChange}
                  onFocus={() => setFocused('number')}
                  onBlur={() => setFocused(null)}
                  keyboardType="numeric"
                  maxLength={23} // Formatted length with spaces
                  editable={!disabled}
                />
              </View>
              {errors.number ? renderError(errors.number) : 
               cardData.number && !errors.number ? renderSuccess() : null}
            </View>

            {/* Expiry and CVC Row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              {/* Expiry Date */}
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  color: COLORS.textSecondary, 
                  fontSize: 12, 
                  fontWeight: '600', 
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  Expiry Date
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.luxuryBlackLighter,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: focused === 'expiry' ? COLORS.primaryGold : 
                             errors.expiry ? COLORS.errorRed : COLORS.darkBorder,
                  paddingHorizontal: 16,
                  minHeight: 56,
                }}>
                  <Calendar size={16} color={COLORS.textMuted} />
                  <TextInput
                    ref={expiryRef}
                    style={{
                      flex: 1,
                      color: COLORS.textPrimary,
                      fontSize: 16,
                      fontWeight: '600',
                      marginLeft: 12,
                      letterSpacing: 1,
                    }}
                    placeholder="MM/YY"
                    placeholderTextColor={COLORS.textMuted}
                    value={cardData.expiryMonth && cardData.expiryYear ? 
                           `${cardData.expiryMonth}/${cardData.expiryYear}` : ''}
                    onChangeText={handleExpiryChange}
                    onFocus={() => setFocused('expiry')}
                    onBlur={() => setFocused(null)}
                    keyboardType="numeric"
                    maxLength={5}
                    editable={!disabled}
                  />
                </View>
                {errors.expiry ? renderError(errors.expiry) : 
                 cardData.expiryMonth && cardData.expiryYear && !errors.expiry ? renderSuccess() : null}
              </View>

              {/* CVC */}
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  color: COLORS.textSecondary, 
                  fontSize: 12, 
                  fontWeight: '600', 
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  CVC
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.luxuryBlackLighter,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: focused === 'cvc' ? COLORS.primaryGold : 
                             errors.cvc ? COLORS.errorRed : COLORS.darkBorder,
                  paddingHorizontal: 16,
                  minHeight: 56,
                }}>
                  <Lock size={16} color={COLORS.textMuted} />
                  <TextInput
                    ref={cvcRef}
                    style={{
                      flex: 1,
                      color: COLORS.textPrimary,
                      fontSize: 16,
                      fontWeight: '600',
                      marginLeft: 12,
                      letterSpacing: 1,
                    }}
                    placeholder={cardBrand === 'amex' ? '1234' : '123'}
                    placeholderTextColor={COLORS.textMuted}
                    value={cardData.cvc}
                    onChangeText={handleCVCChange}
                    onFocus={() => setFocused('cvc')}
                    onBlur={() => setFocused(null)}
                    keyboardType="numeric"
                    maxLength={cardBrand === 'amex' ? 4 : 3}
                    secureTextEntry
                    editable={!disabled}
                  />
                </View>
                {errors.cvc ? renderError(errors.cvc) : 
                 cardData.cvc && !errors.cvc ? renderSuccess() : null}
              </View>
            </View>

            {/* Cardholder Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ 
                color: COLORS.textSecondary, 
                fontSize: 12, 
                fontWeight: '600', 
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Cardholder Name
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.luxuryBlackLighter,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: focused === 'name' ? COLORS.primaryGold : 
                           errors.name ? COLORS.errorRed : COLORS.darkBorder,
                paddingHorizontal: 16,
                minHeight: 56,
              }}>
                <TextInput
                  ref={nameRef}
                  style={{
                    flex: 1,
                    color: COLORS.textPrimary,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                  placeholder="John Doe"
                  placeholderTextColor={COLORS.textMuted}
                  value={cardData.name}
                  onChangeText={handleNameChange}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                  editable={!disabled}
                />
              </View>
              {errors.name ? renderError(errors.name) : 
               cardData.name && !errors.name ? renderSuccess() : null}
            </View>

            {/* Security Notice */}
            <View style={{
              backgroundColor: COLORS.luxuryBlackLight,
              padding: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Lock size={16} color={COLORS.primaryGold} />
              <Text style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginLeft: 8,
                flex: 1,
              }}>
                Your payment information is encrypted and secure. We never store your card details.
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};