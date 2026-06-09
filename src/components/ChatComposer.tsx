import { Ionicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sendUserMessage } from '@/services/chat';

export function ChatComposer() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;

  function handleSend() {
    if (!canSend) return;
    sendUserMessage(draft);
    setDraft('');
  }

  return (
    <View style={[styles.row, { paddingBottom: 12 + insets.bottom }]}>
      <BottomSheetTextInput
        value={draft}
        onChangeText={setDraft}
        placeholder='Ask anything about your trip…'
        placeholderTextColor='#94A3B8'
        style={styles.input}
        multiline
        returnKeyType='send'
        onSubmitEditing={handleSend}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        accessibilityRole='button'
        accessibilityLabel='Send message'
      >
        <Ionicons name='arrow-up' size={20} color='#FFFFFF' />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },
});
