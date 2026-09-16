import { Button, Card, Copy, Eyebrow, Heading, Notice, Screen, Title } from '../../components/ui';
import { API_URL } from '../../lib/api';
import { useLibrary } from '../../lib/library';

export default function SettingsScreen() {
  const { error, reload } = useLibrary();
  return (
    <Screen>
      <Eyebrow>TickerBrief · Private beta</Eyebrow>
      <Title>Settings</Title>
      <Card>
        <Heading>Your data stays here.</Heading>
        <Copy>
          Watchlists, saved reports and personal notes are stored locally on this device. There is
          no account or cloud synchronization.
        </Copy>
        <Copy>
          Uninstalling the app or clearing its storage may permanently remove your research. Device
          backups are controlled by your operating system. Notes are not sent to our backend or an
          AI provider.
        </Copy>
      </Card>
      <Card>
        <Heading>Sources and interpretation</Heading>
        <Copy>
          Financial facts come from SEC filings. This beta supports US-GAAP 10-K filers with USD
          data. Facts, management excerpts, calculations and model interpretation are labeled
          separately.
        </Copy>
        <Copy>
          Interpretation may be unavailable. No example narratives replace it. Research is
          educational and does not provide personalized investment advice.
        </Copy>
      </Card>
      <Card>
        <Heading>Privacy</Heading>
        <Copy>
          The backend receives company searches and report requests. The hosting provider may
          process your IP address in standard server logs. There are no ads, analytics SDKs or
          brokerage connections.
        </Copy>
        <Copy>
          When explicitly enabled by the operator, interpretation sends only public filing evidence
          to the model provider. Your notes and saved library stay on this device.
        </Copy>
      </Card>
      {error && <Notice error>{error}</Notice>}
      <Button title="Reload local library" secondary onPress={() => void reload()} />
      <Card>
        <Heading>Research service</Heading>
        <Copy selectable>{API_URL || 'Not configured in this build'}</Copy>
        <Copy>
          Free beta hosting may need about a minute to wake up. Saved research remains readable
          while the service is offline.
        </Copy>
      </Card>
    </Screen>
  );
}
