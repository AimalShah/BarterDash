import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { PaymentMethodManager, PaymentMethodValidation } from '../components/payment';
import { COLORS } from '../constants/colors';
import { Button } from '../components/ui/Button';

export default function PaymentDemoScreen() {
  const [showValidation, setShowValidation] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  const handleValidationChange = (isValid: boolean, cardData: any) => {
    console.log('Validation changed:', { isValid, cardData });
  };

  const handleMethodSelected = (methodId: string) => {
    setSelectedMethodId(methodId);
    console.log('Method selected:', methodId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar barStyle="light-content" />
      
      <View style={{ 
        paddingTop: 60, 
        paddingHorizontal: 20, 
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.darkBorder,
      }}>
        <Text style={{ 
          color: COLORS.textPrimary, 
          fontSize: 24, 
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          Payment Components Demo
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ marginBottom: 30 }}>
          <Button
            label={showValidation ? "Show Payment Methods" : "Show Card Validation"}
            onPress={() => setShowValidation(!showValidation)}
            variant="outline"
            fullWidth
          />
        </View>

        {showValidation ? (
          <View>
            <Text style={{ 
              color: COLORS.textPrimary, 
              fontSize: 18, 
              fontWeight: '600', 
              marginBottom: 20,
            }}>
              Payment Method Validation
            </Text>
            <PaymentMethodValidation
              onValidationChange={handleValidationChange}
            />
          </View>
        ) : (
          <View>
            <Text style={{ 
              color: COLORS.textPrimary, 
              fontSize: 18, 
              fontWeight: '600', 
              marginBottom: 20,
            }}>
              Payment Method Manager
            </Text>
            <PaymentMethodManager
              userId="demo-user"
              onMethodSelected={handleMethodSelected}
              showAddButton={true}
              allowBiometric={true}
            />
            {selectedMethodId && (
              <View style={{ 
                marginTop: 20, 
                padding: 16, 
                backgroundColor: COLORS.luxuryBlackLight,
                borderRadius: 8,
              }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  Selected Method ID:
                </Text>
                <Text style={{ color: COLORS.primaryGold, fontSize: 14, fontWeight: '600' }}>
                  {selectedMethodId}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}