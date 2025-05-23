# Generated by Django 5.1.7 on 2025-04-17 07:07

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0014_groupmessage_video'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='bio',
            field=models.TextField(blank=True, max_length=500, null=True),
        ),
        migrations.CreateModel(
            name='UserFollow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('follower', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_follows', to=settings.AUTH_USER_MODEL)),
                ('following', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_followers', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('follower', 'following')},
            },
        ),
        migrations.AddField(
            model_name='customuser',
            name='following',
            field=models.ManyToManyField(related_name='followers', through='app.UserFollow', to=settings.AUTH_USER_MODEL),
        ),
    ]
