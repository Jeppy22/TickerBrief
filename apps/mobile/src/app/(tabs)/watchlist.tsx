import { router } from 'expo-router';
import {
  Button,
  Actions,
  Card,
  Copy,
  Eyebrow,
  Heading,
  Loading,
  Notice,
  Screen,
  Title,
} from '../../components/ui';
import { useLibrary } from '../../lib/library';

export default function WatchlistScreen() {
  const { library, error, act } = useLibrary();
  return (
    <Screen>
      <Eyebrow>Your research desk</Eyebrow>
      <Title>Watchlist</Title>
      <Copy>Keep the companies you want to understand close by.</Copy>
      {error && <Notice error>{error}</Notice>}
      {!library && !error && <Loading label="Opening your watchlist…" />}
      {library?.watchlist.length === 0 && (
        <Card>
          <Heading>A little focus goes a long way.</Heading>
          <Copy>
            Open a company brief and add it to your watchlist. Live reports need a connection; saved
            research works offline.
          </Copy>
          <Button title="Find a company" onPress={() => router.navigate('/')} />
        </Card>
      )}
      {library?.watchlist.map((company) => (
        <Card key={company.ticker}>
          <Eyebrow>{company.ticker}</Eyebrow>
          <Heading>{company.name}</Heading>
          <Actions>
            <Button
              title={`Read ${company.ticker} brief`}
              onPress={() =>
                router.push({ pathname: '/report/[ticker]', params: { ticker: company.ticker } })
              }
            />
            <Button
              title="Remove from watchlist"
              secondary
              onPress={() => void act((store) => store.unwatch(company.ticker))}
            />
          </Actions>
        </Card>
      ))}
    </Screen>
  );
}
