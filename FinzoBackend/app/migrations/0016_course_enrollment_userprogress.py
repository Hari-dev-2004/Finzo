# Generated by Django 5.1.7 on 2025-04-19 17:36

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0015_customuser_bio_userfollow_customuser_following'),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('course_id', models.CharField(max_length=50, unique=True)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('total_sections', models.IntegerField()),
                ('estimated_duration', models.CharField(max_length=50)),
                ('author', models.CharField(max_length=255)),
                ('last_updated', models.DateField()),
                ('content_file', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Enrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('enrollment_date', models.DateTimeField(auto_now_add=True)),
                ('last_accessed', models.DateTimeField(auto_now=True)),
                ('is_completed', models.BooleanField(default=False)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='app.course')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'course')},
            },
        ),
        migrations.CreateModel(
            name='UserProgress',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_section', models.IntegerField(default=1)),
                ('completed_sections', models.JSONField(default=list)),
                ('quiz_scores', models.JSONField(default=dict)),
                ('overall_progress', models.IntegerField(default=0)),
                ('enrollment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='progress', to='app.enrollment')),
            ],
        ),
    ]
