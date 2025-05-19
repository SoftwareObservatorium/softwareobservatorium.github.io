import React from 'react';
import Heading from '@theme/Heading';
import clsx from 'clsx';

export default function RecentPosts({ recentPosts }) {
    return (
        <section>
            <div className="container padding--sm">
                <div className="text--center margin-bottom--lg">
                    <Heading as="h2">Recent Blog Posts</Heading>
                </div>
                <div className="recent-post-list">
                    {recentPosts.items.slice(0, 3).map((item, index) => (
                        <a
                            key={index}
                            href={item.permalink}
                            className="card shadow--md recent-post-list-item"
                        >
                            <div className="card__body">
                                <span className="recent-post-date">
                                    {item.date && new Date(item.date).toLocaleDateString()}
                                </span>
                                <h3 className="card__title">{item.title}</h3>
                                {item.description && (
                                    <p className="margin-vert--xs">{item.description}</p>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            </div>
            <style>
                {`
.recent-post-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recent-post-list-item {
  transition: box-shadow 0.2s, transform 0.2s;
  text-decoration: none;
  color: inherit;
  border-left: 4px solid var(--ifm-color-primary);
  padding-left: 0.5rem;
}

.recent-post-list-item:hover {
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.15);
  transform: translateY(-2px) scale(1.01);
  background: var(--ifm-color-emphasis-100);
  color: var(--ifm-link-color);
  text-decoration: none;
}

.recent-post-date {
  font-size: 0.85em;
  color: var(--ifm-color-secondary-darkest);
  margin-bottom: 0.3em;
  display: block;
}
            `}
            </style>

            <br/>
        </section>
    );
}