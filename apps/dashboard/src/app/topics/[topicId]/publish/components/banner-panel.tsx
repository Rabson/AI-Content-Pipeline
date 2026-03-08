import type { StorageObjectView, TopicDetail } from '@aicp/shared-types';
import { formatDate } from '../../../../../lib/formatting';
import {
  clearTopicBannerImageAction,
  setTopicBannerImageAction,
  uploadTopicBannerImageAction,
} from '../../actions';

export function BannerPanel({ topicId, topic, assets }: { topicId: string; topic: TopicDetail | null; assets: StorageObjectView[] }) {
  const imageAssets = assets.filter((asset) => asset.mimeType?.startsWith('image/'));
  return (
    <div className="panel stack">
      <h3>Banner image</h3>
      {topic?.bannerImage?.publicUrl ? <img className="banner-preview" src={topic.bannerImage.publicUrl} alt={topic.bannerImageAlt ?? topic.title} /> : <p className="empty-state">No banner image selected.</p>}
      <p className="topic-meta">{topic?.bannerImageAlt ?? 'No alt text set.'}</p>
      <p className="topic-meta">{topic?.bannerImageCaption ?? 'No caption set.'}</p>
      <form className="create-form" action={uploadTopicBannerImageAction.bind(null, topicId)}>
        <input name="banner" type="file" accept="image/*" required />
        <input name="alt" placeholder="Alt text" defaultValue={topic?.bannerImageAlt ?? ''} />
        <input name="caption" placeholder="Caption" defaultValue={topic?.bannerImageCaption ?? ''} />
        <button className="button" type="submit">Upload banner</button>
      </form>
      {topic?.bannerImage ? (
        <div className="detail-actions">
          <form className="create-form" action={setTopicBannerImageAction.bind(null, topicId)}>
            <input type="hidden" name="storageObjectId" value={topic.bannerImage.id} />
            <input name="alt" placeholder="Alt text" defaultValue={topic.bannerImageAlt ?? ''} />
            <input name="caption" placeholder="Caption" defaultValue={topic.bannerImageCaption ?? ''} />
            <button className="button button-secondary" type="submit">Update metadata</button>
          </form>
          <form action={clearTopicBannerImageAction.bind(null, topicId)}>
            <button className="button button-secondary" type="submit">Remove banner</button>
          </form>
        </div>
      ) : null}
      <div className="asset-grid">
        {imageAssets.map((asset) => (
          <form className="asset-card" key={asset.id} action={setTopicBannerImageAction.bind(null, topicId)}>
            {asset.publicUrl ? <img src={asset.publicUrl} alt={asset.objectKey} /> : null}
            <input type="hidden" name="storageObjectId" value={asset.id} />
            <input type="hidden" name="alt" value={topic?.bannerImageAlt ?? ''} />
            <input type="hidden" name="caption" value={topic?.bannerImageCaption ?? ''} />
            <p className="topic-meta">{asset.objectKey}</p>
            <p className="topic-meta">Uploaded {formatDate(asset.createdAt)}</p>
            <button className="button button-secondary" type="submit">Use this image</button>
          </form>
        ))}
        {!imageAssets.length ? <p className="empty-state">No uploaded image assets yet.</p> : null}
      </div>
    </div>
  );
}
