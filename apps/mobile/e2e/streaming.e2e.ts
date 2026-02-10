describe('Streaming E2E (Detox)', () => {
  const sellerStreamId = process.env.E2E_SELLER_STREAM_ID;
  const viewerStreamId = process.env.E2E_VIEWER_STREAM_ID;

  const withPermissions = {
    permissions: {
      camera: 'YES',
      microphone: 'YES',
    },
  } as const;

  it('seller can open go-live and toggle mic/camera', async () => {
    if (!sellerStreamId) {
      console.warn('Skipping seller streaming test: E2E_SELLER_STREAM_ID not set');
      return;
    }

    await device.launchApp({
      newInstance: true,
      url: `barterdash://seller/go-live?streamId=${sellerStreamId}`,
      ...withPermissions,
    });

    await expect(element(by.id('seller-stream-video'))).toBeVisible();
    await expect(element(by.id('seller-mic-toggle'))).toBeVisible();
    await expect(element(by.id('seller-camera-toggle'))).toBeVisible();

    await element(by.id('seller-mic-toggle')).tap();
    await element(by.id('seller-camera-toggle')).tap();

    await expect(element(by.id('seller-go-live-button'))).toBeVisible();
  });

  it('viewer can join stream and open chat', async () => {
    if (!viewerStreamId) {
      console.warn('Skipping viewer streaming test: E2E_VIEWER_STREAM_ID not set');
      return;
    }

    await device.launchApp({
      newInstance: true,
      url: `barterdash://stream/${viewerStreamId}`,
      ...withPermissions,
    });

    await expect(element(by.id('viewer-stream-video'))).toBeVisible();
    await expect(element(by.id('stream-chat-input'))).toBeVisible();

    await element(by.id('stream-chat-input')).typeText('Hello from Detox');
    await element(by.id('stream-chat-send')).tap();
  });
});
