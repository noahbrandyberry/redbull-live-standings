import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { orderBy } from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNowStrict, getUnixTime, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { camelizeKeys, decamelizeKeys } from "humps";

const baseUrl = `https://data.aoe2companion.com`;

export async function fetchJson(
  title: string,
  input: RequestInfo,
  init?: RequestInit
) {
  if (init) {
    console.log(input, init);
  } else {
    console.log(input);
  }
  let response = null;
  try {
    response = await fetch(input, {
      ...init,
      // headers: {
      //     apikey: apiKey,
      // },
      // timeout: 60 * 1000,
    });
    const text = await response.text();
    return JSON.parse(text, dateReviver);
  } catch (e) {
    console.log(input, "failed", response?.status);
  }
}

const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

export function dateReviver(key, value) {
  // console.log(key, value);
  if (typeof value === "string" && dateFormat.test(value)) {
    // console.log("DATE", value);
    // return new Date(value);
    return parseISO(value);
  }
  return value;
}

export function removeReactQueryParams(params: any) {
  const { queryKey, pageParam, meta, signal, ...rest } = params;
  return rest;
}

export async function fetchProfile(params: IFetchProfileParams) {
  console.log("fetchProfile", params);
  const queryString = makeQueryString(
    decamelizeKeys({
      ...removeReactQueryParams(params),
      page: params.pageParam || 1,
    })
  );
  const url = `${baseUrl}/api/profiles/${params.profileId}?${queryString}`;
  return camelizeKeys(
    await fetchJson("fetchProfile", url)
  ) as unknown as IProfileResult;
}

export async function fetchLeaderboard(params: IFetchLeaderboardParams) {
  const queryString = makeQueryString(
    decamelizeKeys({
      ...removeReactQueryParams(params),
      page: params.pageParam || 1,
    })
  );
  const url = `${baseUrl}/api/leaderboards/${params.leaderboardId}?${queryString}`;
  return camelizeKeys(await fetchJson("fetchLeaderboard", url)) as ILeaderboard;
}

interface IParams {
  [key: string]: any;
}

interface ILeaderboard {
  leaderboardId: number;
  total: number;
  start: number;
  count: number;
  page: number;
  country: string;
  players: ILeaderboardPlayer[];
}

interface IProfileResult {
  profileId: number;
  name: string;
  games: number;
  country: string;
  countryIcon: string;
  verified: boolean;
  leaderboards: IProfileLeaderboardResult[];
  ratings: IProfileRatingsLeaderboard[];
}

interface IProfileLeaderboardResult {
  leaderboardId: any;
  leaderboardName: string;
  abbreviation: string;
  profileId?: number;
  name?: string;
  rank?: number;
  rating?: number;
  maxRating?: number;
  lastMatchTime?: string;
  drops?: number;
  losses?: number;
  streak?: number;
  wins?: number;
  updatedAt?: string;
  rankCountry?: number;
}

interface IProfileRatingsLeaderboard {
  leaderboardId: string;
  leaderboardName: string;
  abbreviation: string;
  ratings: IProfileRatingsRating[];
}

interface IProfileRatingsRating {
  leaderboardId: number;
  profileId: number;
  games: number;
  rating: number;
  ratingDiff?: number;
  date: Date;
}

export function makeQueryString(params: IParams) {
  return new URLSearchParams(params).toString();
  // return Object.keys(params)
  //     .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
  //     .join('&');
}

interface IFetchProfileParams {
  page?: number;
  search?: string;
  steamId?: string;
  profileId?: number;
  country?: string;

  pageParam?: string;
}

interface IFetchLeaderboardParams {
  leaderboardId: number;
  page?: number;
  search?: string;
  steamId?: string;
  profileId?: number;
  country?: string;

  pageParam?: string;
}

interface ILeaderboardDef {
  leaderboardId: number;
  leaderboardName: string;
  abbreviation: string;
}

interface ILeaderboardPlayer {
  leaderboardId: number;
  profileId: number;
  name: string;
  rank: number;
  rankCountry: number;
  rating: number;
  lastMatchTime: Date;
  streak: number;
  wins: number;
  losses: number;
  drops: number;
  updatedAt: string;
  games: number;
  country: string;
}

export function formatAgo(date: Date) {
  // return formatDistanceToNowStrict(date, {addSuffix: true});
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function Index() {
  const leaderboard = {
    abbreviation: "RB 1v1",
    abbreviationSubtitle: "1v1",
    abbreviationTitle: "RB",
    active: true,
    leaderboardId: "ew_1v1_redbullwololo",
    leaderboardName: "Red Bull Wololo 1v1",
  } as unknown as ILeaderboardDef;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex flex-row px-12 py-8 gap-8 text-white min-h-screen items-center relative">
        <div className="absolute bg-[url('/red-bull-wololo-el-reinado-background.jpg')] bg-cover inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/90 to-black" />
        <div className="flex-1 relative">
          <p className="text-lg pb-8">
            On the 28th of July, the four players with the highest-achieved
            rating will be directly invited to the main event at Castillo de
            Almodóvar del Río in Spain.
          </p>

          <PlayerList leaderboard={leaderboard} search="" />

          <div className="flex flex-row gap-2 items-center justify-end py-4">
            <div className="w-6 h-6 bg-[#D00E4D]"></div>
            <p className="text-lg uppercase font-semibold">
              In Qualified Position
            </p>
          </div>
        </div>

        <img
          src="/red-bull-wololo-el-reinado.png"
          className="h-[635px] w-[473px] relative"
        />
      </main>
    </QueryClientProvider>
  );
}

const addMaxRatingToPlayer = async (
  player: ILeaderboardPlayer,
  leaderboardId: string | number
) => {
  const { leaderboards, countryIcon } = await fetchProfile({
    profileId: player.profileId,
  });

  const leaderboard = leaderboards.find(
    (rating) => rating.leaderboardId === leaderboardId
  );

  return {
    ...player,
    countryIcon,
    rating: leaderboard.rating,
    maxRating: leaderboard.maxRating ?? 0,
  };
};

export function PlayerList({
  leaderboard,
  search,
}: {
  leaderboard: ILeaderboardDef;
  search: string;
}) {
  const [time, setTime] = useState(getUnixTime(new Date()));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(getUnixTime(new Date()));
    }, 60000);
    return () => {
      clearInterval(intervalId);
    };
  });

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["leaderboard-players", leaderboard.leaderboardId],
    queryFn: async () => {
      const { players, ...rest } = await fetchLeaderboard({
        leaderboardId: leaderboard.leaderboardId as number,
      });

      const playersWithRatings = await Promise.all(
        players
          .slice(0, 25)
          .map((player) =>
            addMaxRatingToPlayer(player, leaderboard.leaderboardId)
          )
      );

      return { ...rest, players: playersWithRatings };
    },
    staleTime: Infinity,
  });

  const players = orderBy(data?.players, "maxRating", "desc")?.slice(0, 10);

  return (
    <div>
      <div className="pb-2 mb-8 border-b-2 border-[#EAC65E] flex flex-row justify-between items-center">
        <h2 className="text-5xl uppercase font-bold">Current Top 10</h2>

        <button onClick={() => refetch()}>
          <FontAwesomeIcon
            spin={isFetching}
            icon={faArrowsRotate}
            color="#EAC65E"
            size="lg"
          />
        </button>
      </div>
      {!players || players.length === 0 ? (
        <p className="text-lg text-center">
          {isFetching ? "Loading..." : "Unable to fetch players"}
        </p>
      ) : (
        <table className={`w-full text-sm text-left`}>
          <thead className={`text-lg uppercase`}>
            <tr>
              <th scope="col" className="py-2 px-6">
                Player
              </th>
              <th scope="col" className="py-2 px-6">
                Highest Rating
              </th>
              <th scope="col" className="py-2 px-6">
                Current Rating
              </th>
              <th scope="col" className="py-2 px-6">
                Wins
              </th>
              <th scope="col" className="py-2 px-6">
                Games
              </th>
              <th scope="col" className="py-2 px-6">
                Last Match
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.profileId} className="">
                <th
                  scope="row"
                  className={`py-3 px-6 font-bold text-lg flex flex-row items-center gap-2 border-t border-t-gray-700 ${
                    index < 4 ? "border-l-4 border-[#D00E4D]" : ""
                  }`}
                >
                  <span className="text-2xl">{player.countryIcon}</span>
                  <span>{player.name}</span>
                </th>
                <td className="py-3 px-6 text-lg font-bold border-t border-t-gray-700">
                  {player.maxRating}
                </td>
                <td className="py-3 px-6 text-lg border-t border-t-gray-700">
                  {player.rating}
                </td>
                <td className="py-3 px-6 text-lg border-t border-t-gray-700">
                  {((player.wins / player.games) * 100).toFixed(0)}%
                </td>
                <td className="py-3 px-6 text-lg border-t border-t-gray-700">
                  {player.games}
                </td>
                <td
                  className="py-3 px-6 text-lg border-t border-t-gray-700"
                  key={time.toString()}
                >
                  {formatAgo(player.lastMatchTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Index;
