import { engagementPhoto, galleryPhotos } from './photos'
import { SectionHeading } from './SectionHeading'
import './PhotoStory.css'

export function EngagementPhoto() {
  return <figure className="engagement-photo"><div className="photo-print"><img src={engagementPhoto.src} alt={engagementPhoto.alt} width={engagementPhoto.width} height={engagementPhoto.height} decoding="async" /><figcaption>{engagementPhoto.caption}</figcaption></div><p className="label">And the best is yet to come</p></figure>
}

export function PhotoStory() {
  return <section className="section photo-story" id="moments" aria-labelledby="photo-story-heading">
    <div className="section-inner">
      <SectionHeading numeral="viii" label="The little things. The big adventures." id="photo-story-heading" title={<>A few favourite <em>moments</em></>}>Here’s to a lifetime more.</SectionHeading>
      <div className="photo-gallery">{galleryPhotos.map(photo => <figure className="photo-print" key={photo.id}><a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`View full photo: ${photo.alt} (opens in a new tab)`}><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" /></a><figcaption>{photo.caption}</figcaption></figure>)}</div>
    </div>
  </section>
}
