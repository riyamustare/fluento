from django.core.management.base import BaseCommand
from app.models import Level


class Command(BaseCommand):
    help = 'Create initial 21 levels with example topics and increasing difficulty'

    def handle(self, *args, **options):
        # Define 21 diverse topics with progressively increasing difficulty
        topics = [
            'Introduce yourself',
            'Describe your favorite hobby',
            'Talk about your last vacation',
            'Explain your daily routine',
            'Discuss your career goals',
            'Describe a meaningful childhood memory',
            'Explain a challenging problem you solved',
            'Talk about a book or movie that influenced you',
            'Describe your ideal weekend',
            'Explain a cultural tradition from your country',
            'Discuss a recent technology trend',
            'Describe a project you led',
            'Give advice to your younger self',
            'Explain a controversial opinion and defend it',
            'Describe a complex process you understand well',
            'Tell a story about an unexpected failure and lesson',
            'Compare two cities or countries you know',
            'Describe your approach to learning new skills',
            'Explain how you handle stress and deadlines',
            'Discuss ethical considerations in technology',
            'Outline a five-year personal and professional plan',
        ]

        for idx, topic in enumerate(topics, start=1):
            # Increase difficulty gradually
            difficulty = min(10, idx // 2 + 1)

            # Build a longer English and German text template for read mode
            eng = (
                f"Level {idx}: {topic}. "
                f"In this exercise, you should speak for about one minute on the topic. "
                f"Try to include personal examples, specific details, and reflections that show depth of thought. "
                f"For example, explain why this topic matters to you, give an anecdote, and describe any outcomes or lessons learned. "
                f"Aim for clear sentence structure and varied vocabulary."
            )

            ger = (
                f"Level {idx}: {topic} (Deutsch). "
                f"In dieser Übung sollten Sie etwa eine Minute lang zum Thema sprechen. "
                f"Versuchen Sie, persönliche Beispiele, konkrete Details und Reflexionen einzubeziehen, die Tiefe zeigen. "
                f"Erklären Sie zum Beispiel, warum dieses Thema für Sie wichtig ist, erzählen Sie eine Anekdote und beschreiben Sie Ergebnisse oder Lektionen. "
                f"Achten Sie auf klare Satzstruktur und abwechslungsreichen Wortschatz."
            )

            level, created = Level.objects.get_or_create(
                id=idx,
                defaults={
                    'topic': topic,
                    'difficulty': difficulty,
                    'text': eng,
                    'text_german': ger,
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created level {level.id}: {level.topic}'))
            else:
                # Update existing level with missing fields or updated templates
                changed = False
                if not level.text:
                    level.text = eng
                    changed = True
                if not level.text_german:
                    level.text_german = ger
                    changed = True
                if changed:
                    level.save()
                self.stdout.write(f'Level {level.id} already exists')

