import type { Mention } from '@mentio-dev/sdk';
import Link from 'next/link';
import { CornerUpLeft, Send } from 'lucide-react';
import { MentionRowMenu } from '@/components/mention-row-menu';
import { MentionSelection, SelectAll, SelectRow } from '@/components/mention-selection';
import { MentionStatus } from '@/components/mention-status';
import { PlatformIcon } from '@/components/platform-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { platformName, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const SENTIMENT_DOT: Record<string, string> = { positive: 'bg-emerald-500', neutral: 'bg-zinc-400', negative: 'bg-red-500' };

/**
 * The mentions list as the Mentio dashboard shows it, on shadcn's Table: one
 * row per mention, the post's own platform, its text (with what it replies
 * to), the keyword, the author, the verdict and the triage state. A row
 * opens the mention; the menu at its end triages it in place.
 */
export function MentionTable({ mentions }: { mentions: Mention[] }) {
  return (
    <MentionSelection ids={mentions.map((m) => m.id)}>
    <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="h-9 w-10 pr-0">
              <SelectAll />
            </TableHead>
            <TableHead className="h-9 w-14 text-[11px]">Source</TableHead>
            <TableHead className="text-[11px]">Mention</TableHead>
            <TableHead className="text-[11px]">Keyword</TableHead>
            <TableHead className="text-[11px]">Author</TableHead>
            <TableHead className="text-[11px]">Sentiment</TableHead>
            <TableHead className="text-right text-[11px]">Pri</TableHead>
            <TableHead className="text-right text-[11px]">Rel</TableHead>
            <TableHead className="text-[11px]">Status</TableHead>
            <TableHead className="text-[11px]">Date</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {mentions.map((mention) => {
            const verdict = mention.classification;
            const author = mention.author;
            return (
              <TableRow key={mention.id} className="relative cursor-pointer">
                <TableCell className="w-10 pr-0">
                  <SelectRow id={mention.id} />
                </TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger render={<span className="relative z-10 inline-flex" />}>
                      <PlatformIcon platform={mention.post.platform} className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>{platformName(mention.post.platform)}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="max-w-[26rem] whitespace-normal">
                  {/* The link covers the whole row (after:inset-0), so a click anywhere opens the mention. */}
                  <Link href={`/mentions/${mention.id}`} className="block after:absolute after:inset-0">
                    {mention.post.replyTo?.author ? (
                      <span className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CornerUpLeft className="size-3" /> Replying to {mention.post.replyTo.author}
                      </span>
                    ) : null}
                    <span className="line-clamp-2 leading-snug">{mention.post.text}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-md font-mono text-[11px] font-normal">{mention.keyword.term}</Badge>
                </TableCell>
                <TableCell>
                  <span className="flex max-w-40 items-center gap-1.5">
                    <Avatar className="size-5">
                      {author?.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
                      <AvatarFallback className="text-[10px] font-semibold">{(author?.name ?? '?').replace(/^@/, '').slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-muted-foreground">{author?.handle ?? author?.name ?? 'Unknown'}</span>
                  </span>
                </TableCell>
                <TableCell>
                  {verdict?.sentiment ? (
                    <span className="flex items-center gap-1.5">
                      <span className={cn('size-1.5 rounded-full', SENTIMENT_DOT[verdict.sentiment])} />
                      {verdict.sentiment.charAt(0).toUpperCase() + verdict.sentiment.slice(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not scored</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">{Math.round(mention.priority * 10) / 10}</TableCell>
                <TableCell className={cn('text-right font-mono', !mention.relevant && 'text-muted-foreground')}>{verdict?.relevance ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <MentionStatus id={mention.id} status={mention.status} />
                    {mention.delivered ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Send /> Delivered
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{timeAgo(mention.post.publishedAt)}</TableCell>
                <TableCell className="relative z-10 px-2">
                  <MentionRowMenu id={mention.id} status={mention.status} url={mention.post.url} platform={platformName(mention.post.platform)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </MentionSelection>
  );
}
